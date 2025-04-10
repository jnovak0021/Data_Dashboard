import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Responsive, WidthProvider } from 'react-grid-layout';
import DashboardPane from './DashboardPane';
import { fetchUserId } from "../../utils/auth";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface APIData {
  apiId: number;
  userId: number;
  apiName: string;
  apiString: string;
  apiKey: string;
  graphType: string;
  paneX: number;
  paneY: number;
  parameters: (string | { parameter: string })[] | null;
}

interface Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface DashboardProps {
  refresh: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ refresh }) => {
  const router = useRouter();
  const { id: dashboardId } = router.query;
  
  const [apis, setApis] = useState<APIData[]>([]);
  const [apiData, setApiData] = useState<{ apiId: number; data: any }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState(0);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>(() => {
    // Try to load saved layouts from localStorage
    if (typeof window !== 'undefined' && dashboardId) {
      const layoutKey = `dashboardLayout_${dashboardId}`;
      const savedLayouts = localStorage.getItem(layoutKey);
      return savedLayouts ? JSON.parse(savedLayouts) : { lg: [], md: [], sm: [], xs: [] };
    }
    return { lg: [], md: [], sm: [], xs: [] };
  });

  // Fetch the list of APIs based on dashboard ID
  useEffect(() => {
    const fetchAPIs = async () => {
      // Only proceed if we have a dashboard ID
      if (!dashboardId) {
        // If on the home page or dashboard index page, we might not have a specific dashboard
        // You could either leave loading as true, show a message, or handle differently
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const fetchedUserId = await fetchUserId();
        if (fetchedUserId === null) {
          throw new Error('Failed to fetch user ID');
        }
        setUserId(fetchedUserId);

        // Fetch dashboard details to get its panes
        const response = await fetch(`http://localhost:8000/api/go/dashboards/${dashboardId}`);
        if (!response.ok) {
          throw new Error(`Error fetching dashboard: ${response.statusText}`);
        }
        
        const dashboardData = await response.json();
        const apiList = dashboardData.panes || [];
        
        console.log('Fetched APIs for dashboard:', apiList);
        setApis(apiList);
        
        // Generate layout if no saved layout exists or if APIs have changed
        if (!layouts.lg.length || layouts.lg.length !== apiList.length) {
          generateInitialLayout(apiList);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAPIs();
  }, [refresh, dashboardId]);

  // Fetch data for each API
  useEffect(() => {
    const getApiData = async (api: APIData) => {
      try {
        const response = await fetch(api.apiString);
        if (!response.ok) {
          throw new Error(`Error fetching data for API ${api.apiId}: ${response.statusText}`);
        }
        const data = await response.json();
        return { apiId: api.apiId, data };
      } catch (err: any) {
        console.error(`Error fetching data for API ${api.apiId}:`, err.message);
        return { apiId: api.apiId, data: null };
      }
    };

    const fetchAllApiData = async () => {
      if (apis.length > 0) {
        try {
          const results = await Promise.all(apis.map((api) => getApiData(api)));
          console.log('Fetched API Data:', results);
          setApiData(results);
        } catch (err) {
          console.error('Error fetching API data:', err);
        }
      }
    };

    fetchAllApiData();
  }, [apis]);

  // Save layouts to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && layouts.lg.length > 0 && dashboardId) {
      const layoutKey = `dashboardLayout_${dashboardId}`;
      localStorage.setItem(layoutKey, JSON.stringify(layouts));
    }
  }, [layouts, dashboardId]);

  // Generate initial layout based on APIs
  const generateInitialLayout = (apiList: APIData[]) => {
    const lgLayout: Layout[] = [];
    const mdLayout: Layout[] = [];
    const smLayout: Layout[] = [];
    const xsLayout: Layout[] = [];
    
    apiList.forEach((api, index) => {
      // Calculate size in grid units (1 grid unit = 50px by default)
      const w = Math.max(Math.ceil(api.paneX / 100), 3); // Min width of 3
      const h = Math.max(Math.ceil(api.paneY / 100), 3); // Min height of 3
      
      // Add to layouts for different breakpoints
      lgLayout.push({
        i: `${api.apiId}`,
        x: (index % 3) * 3,
        y: Math.floor(index / 3) * 3,
        w,
        h,
        minW: 2,
        minH: 2
      });
      
      mdLayout.push({
        i: `${api.apiId}`,
        x: (index % 2) * 3,
        y: Math.floor(index / 2) * 3,
        w,
        h,
        minW: 2,
        minH: 2
      });
      
      smLayout.push({
        i: `${api.apiId}`,
        x: 0,
        y: index * 3,
        w: 6,
        h,
        minW: 2,
        minH: 2
      });
      
      xsLayout.push({
        i: `${api.apiId}`,
        x: 0,
        y: index * 3,
        w: 4,
        h,
        minW: 2,
        minH: 2
      });
    });
    
    setLayouts({ lg: lgLayout, md: mdLayout, sm: smLayout, xs: xsLayout });
  };

  // Handle layout changes
  const onLayoutChange = (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setLayouts(allLayouts);
  };

  // Handle pane deletion
  const handleDeletePane = async (apiId: number) => {
    if (!confirm(`Are you sure you want to delete this pane?`)) {
      return;
    }
    
    console.log(`Deleting pane with ID: ${apiId}`);
    
    // Remove the association between dashboard and API if we have a dashboard ID
    if (dashboardId) {
      try {
        const response = await fetch(`http://localhost:8000/api/go/dashboards/${dashboardId}/panes/${apiId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to remove pane from dashboard: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error removing pane from dashboard:', error);
      }
    }
    
    // Update APIs state - remove the deleted API
    setApis(prevApis => prevApis.filter(api => api.apiId !== apiId));
    
    // Update apiData state - remove the deleted API data
    setApiData(prevData => prevData.filter(data => data.apiId !== apiId));
    
    // Update layouts state - remove the layout item with matching ID
    setLayouts(prevLayouts => {
      const newLayouts = { ...prevLayouts };
      
      // For each breakpoint (lg, md, sm, xs), filter out the layout item
      for (const breakpoint in newLayouts) {
        if (Object.prototype.hasOwnProperty.call(newLayouts, breakpoint)) {
          newLayouts[breakpoint] = newLayouts[breakpoint].filter(
            item => item.i !== `${apiId}`
          );
        }
      }
      
      return newLayouts;
    });
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }
  
  if (!dashboardId) {
    return <div className="text-center p-4">No dashboard selected</div>;
  }

  return (
    <div className="dashboard-container">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 9, sm: 6, xs: 4 }}
        rowHeight={50}
        onLayoutChange={onLayoutChange}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        margin={[20, 20]}
        containerPadding={[20, 20]}
        draggableCancel=".btn-delete"
      >
        {apis.map((api) => {
          const apiSpecificData = apiData.find((data) => data.apiId === api.apiId)?.data;
          return (
            <div key={`${api.apiId}`} className="dashboard-pane-container">
              <DashboardPane
                index={api.apiId}
                sizeX={api.paneX}
                sizeY={api.paneY}
                queryString={api.apiString}
                graphType={api.graphType || 'pie'}
                parameters={api.parameters?.map((p) => (typeof p === 'object' && 'parameter' in p ? p.parameter : p)) || []}
                apiData={apiSpecificData}
                onDelete={handleDeletePane}
              />
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
};

export default Dashboard;