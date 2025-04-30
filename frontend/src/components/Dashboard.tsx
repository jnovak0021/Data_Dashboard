import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Responsive, WidthProvider } from 'react-grid-layout';
import DashboardPane from './DashboardPane';
import { fetchUserId } from '../../utils/auth';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import MapPane from './GraphTypes/MapPane';


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
  rootKey: string;
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
  const id = router.query.id;
  const dashboardId = Array.isArray(id) ? id[0] : id;

  const [apis, setApis] = useState<APIData[]>([]);
  const [apiData, setApiData] = useState<{ apiId: number; data: any }[]>([]);
  const [userId, setUserId] = useState(0);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({ lg: [], md: [], sm: [], xs: [] });
  const [forceRefresh, setForceRefresh] = useState(false);
  // Add state for marker data URL if needed
  const [markerDataUrl, setMarkerDataUrl] = useState<string | undefined>(undefined);

  const fetchAPIs = useCallback(async () => {
    if (!dashboardId) return;

    try {
      const fetchedUserId = await fetchUserId();
      if (fetchedUserId === null) {
        console.warn('No user ID found');
        return;
      }
      setUserId(fetchedUserId);

      const response = await fetch(`http://localhost:8000/api/go/dashboards/${dashboardId}`);
      if (response.ok) {
        const dashboardData = await response.json();
        let apiList: APIData[] = dashboardData.panes || [];

        // Check if map pane already exists
        const hasMapPane = apiList.some(api => api.graphType === 'map');
        
        setApis(apiList);
        generateInitialLayout(apiList);
        
        // Optional: Check if dashboard has marker data and set it
        if (dashboardData.markerDataUrl) {
          setMarkerDataUrl(dashboardData.markerDataUrl);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard APIs:', err);
    }
  }, [dashboardId]);

  useEffect(() => {
    fetchAPIs();
  }, [fetchAPIs, refresh, forceRefresh]);

  useEffect(() => {
    const handleDashboardUpdate = () => {
      setForceRefresh(prev => !prev);
    };
    window.addEventListener('dashboard-update', handleDashboardUpdate);
    return () => window.removeEventListener('dashboard-update', handleDashboardUpdate);
  }, []);

  useEffect(() => {
    const fetchAllApiData = async () => {
      const results = await Promise.all(apis.map(async (api) => {
        if (api.graphType === 'map') return { apiId: api.apiId, data: null };
        try {
          const response = await fetch(api.apiString);
          if (response.ok) {
            const data = await response.json();
            return { apiId: api.apiId, data };
          } else {
            throw new Error('API fetch failed');
          }
        } catch (err) {
          console.error(`Failed fetching data for API ${api.apiId}`, err);
          return { apiId: api.apiId, data: null };
        }
      }));
      setApiData(results);
    };

    fetchAllApiData();
  }, [apis]);

  useEffect(() => {
    if (dashboardId && layouts.lg.length) {
      const layoutKey = `dashboardLayout_${dashboardId}`;
      localStorage.setItem(layoutKey, JSON.stringify(layouts));
    }
  }, [layouts, dashboardId]);

  const generateInitialLayout = (apiList: APIData[]) => {
    if (!dashboardId) return;
    
    // Try to load saved layout from localStorage first
    const layoutKey = `dashboardLayout_${dashboardId}`;
    const savedLayout = localStorage.getItem(layoutKey);
    
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout);
        
        // Check if saved layout contains all current APIs
        const allApisInLayout = apiList.every(api => 
          parsedLayout.lg.some((item: Layout) => item.i === `${api.apiId}`));
          
        if (allApisInLayout) {
          setLayouts(parsedLayout);
          return;
        }
      } catch (e) {
        console.warn('Error parsing saved layout, generating new one', e);
      }
    }
    
    const makeLayout = () => {
      return apiList.map((api, index) => ({
        i: `${api.apiId}`,
        x: (index % 3) * 3,
        y: Math.floor(index / 3) * 3,
        w: Math.max(Math.ceil(api.paneX / 100), 3),
        h: Math.max(Math.ceil(api.paneY / 100), 3),
        minW: 2,
        minH: 2,
        isResizable: api.graphType !== 'map' // 👈 only maps are locked
      }));
    };

    const layout = makeLayout();
    setLayouts({ lg: layout, md: layout, sm: layout, xs: layout });
  };

  const onLayoutChange = (_: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setLayouts(allLayouts);
  };

  const handleDeletePane = async (apiId: number) => {
    if (apiId === -1) return alert('Map pane cannot be deleted.');
    if (!confirm('Are you sure you want to delete this pane?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/go/dashboards/${dashboardId}/panes/${apiId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Failed to delete pane: ${response.statusText}`);
      setApis(prev => prev.filter(api => api.apiId !== apiId));
      setApiData(prev => prev.filter(data => data.apiId !== apiId));
      setLayouts(prev => {
        const newLayouts = { ...prev };
        Object.keys(newLayouts).forEach(key => {
          newLayouts[key] = newLayouts[key].filter(item => item.i !== `${apiId}`);
        });
        return newLayouts;
      });
      fetchAPIs();
    } catch (err) {
      console.error('Error deleting pane:', err);
      alert('Failed to delete pane.');
    }
  };

  return (
    <div className="dashboard-container">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 9, sm: 6, xs: 4 }}
        rowHeight={50}
        onLayoutChange={onLayoutChange}
        isDraggable
        isResizable
        compactType="vertical"
        margin={[20, 20]}
        containerPadding={[20, 20]}
      >
        {apis.map((api) => {
          if (api.graphType === 'map') {
            return (
              <div key={`${api.apiId}`} data-grid={{ x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 4 }}>
                <div className="pane relative w-full h-full border border-blue-400 bg-white p-4 rounded-lg shadow overflow-hidden">
                  <div className="mb-3 text-lg font-semibold text-gray-700">Map View</div>
                  <MapPane
                    markerDataUrl={api.apiString} // 👈 This must point to your API
                    initialCoordinates={[0, 0]}
                    initialZoom={2}
                    onDelete={() => handleDeletePane(api.apiId)}
                  />
                </div>
              </div>
            );
          }

          const apiSpecificData = apiData.find(d => d.apiId === api.apiId)?.data;
          return (
            <div key={`${api.apiId}`} className="dashboard-pane-container">
              <DashboardPane
                index={api.apiId}
                sizeX={api.paneX}
                sizeY={api.paneY}
                queryString={api.apiString}
                graphType={api.graphType || 'pie'}
                parameters={api.parameters?.map(p => (typeof p === 'object' ? p.parameter : p)) || []}
                apiData={apiSpecificData}
                rootKey={api.rootKey}
                apiName={api.apiName}
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