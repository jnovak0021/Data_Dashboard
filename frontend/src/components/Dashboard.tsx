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
  parameters: string[] | null;
  rootKeys: string[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apis, setApis] = useState<APIData[]>([]);
  const [apiData, setApiData] = useState<{ apiId: number; data: any }[]>([]);
  const [userId, setUserId] = useState(0);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({ lg: [], md: [], sm: [], xs: [] });

  const router = useRouter();
  const id = router.query.id;
  const dashboardId = Array.isArray(id) ? id[0] : id;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE;

  const fetchAPIs = useCallback(async () => {
    if (!dashboardId) return;

    try {
      const fetchedUserId = await fetchUserId();
      if (fetchedUserId === null) {
        console.warn('No user ID found');
        return;
      }

      setLoading(true);
      setUserId(fetchedUserId);

      const response = await fetch(`${BASE_URL}/api/go/dashboards/${dashboardId}`);
      if (!response.ok) {
        throw new Error(`Error fetching dashboard: ${response.statusText}`);
      }

      const dashboardData = await response.json();
      const apiList = dashboardData.panes || [];

      const processedApis = apiList.map((api: any) => ({
        ...api,
        rootKeys: Array.isArray(api.rootKeys)
          ? api.rootKeys.map((key: any) => (typeof key === 'string' ? key : ''))
          : [],
      }));

      setApis(processedApis);

      if (!layouts.lg.length || layouts.lg.length !== apiList.length) {
        generateInitialLayout(apiList);
      }
    } catch (err: any) {
      console.error('Error fetching APIs:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dashboardId, layouts.lg.length, BASE_URL]);

  useEffect(() => {
    fetchAPIs();
  }, [fetchAPIs, refresh]);

  useEffect(() => {
    const fetchAllApiData = async () => {
      if (apis.length > 0) {
        try {
          const results = await Promise.all(
            apis.map(async (api) => {
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
            })
          );
          setApiData(results);
        } catch (err) {
          console.error('Error fetching API data:', err);
        }
      }
    };

    fetchAllApiData();
  }, [apis]);

  const generateInitialLayout = (apiList: APIData[]) => {
    const lgLayout: Layout[] = [];
    const mdLayout: Layout[] = [];
    const smLayout: Layout[] = [];
    const xsLayout: Layout[] = [];

    apiList.forEach((api, index) => {
      const w = Math.max(Math.ceil(api.paneX / 100), 3);
      const h = Math.max(Math.ceil(api.paneY / 100), 3);

      lgLayout.push({ i: `${api.apiId}`, x: (index % 3) * 3, y: Math.floor(index / 3) * 3, w, h, minW: 2, minH: 2 });
      mdLayout.push({ i: `${api.apiId}`, x: (index % 2) * 3, y: Math.floor(index / 2) * 3, w, h, minW: 2, minH: 2 });
      smLayout.push({ i: `${api.apiId}`, x: 0, y: index * 3, w: 6, h, minW: 2, minH: 2 });
      xsLayout.push({ i: `${api.apiId}`, x: 0, y: index * 3, w: 4, h, minW: 2, minH: 2 });
    });

    setLayouts({ lg: lgLayout, md: mdLayout, sm: smLayout, xs: xsLayout });
  };

  const onLayoutChange = (_: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setLayouts(allLayouts);
  };

  const handleDeletePane = async (apiId: number) => {
    if (!confirm('Are you sure you want to delete this pane?')) return;

    try {
      const response = await fetch(`${BASE_URL}/api/go/dashboards/${dashboardId}/panes/${apiId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to remove pane from dashboard: ${response.statusText}`);
      }

      setApis((prevApis) => prevApis.filter((api) => api.apiId !== apiId));
      setApiData((prevData) => prevData.filter((data) => data.apiId !== apiId));
      setLayouts((prevLayouts) => {
        const newLayouts = { ...prevLayouts };
        for (const breakpoint in newLayouts) {
          if (Object.prototype.hasOwnProperty.call(newLayouts, breakpoint)) {
            newLayouts[breakpoint] = newLayouts[breakpoint].filter((item) => item.i !== `${apiId}`);
          }
        }
        return newLayouts;
      });
    } catch (error) {
      console.error('Error deleting pane:', error);
    }
  };
  
  if (!refresh) {
    return null; // Ensure a valid ReactNode is returned when refresh is false
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      <ResponsiveGridLayout
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 9, sm: 6, xs: 4 }}
        rowHeight={50}
        onLayoutChange={onLayoutChange}
        isResizable
        compactType="vertical"
      >
        {apis.map((api) => (
          <div key={api.apiId}>
            {api.graphType === 'map' ? (
              <MapPane
              markerDataUrl={api.apiString}
              rootKeys={api.rootKeys}
              initialCoordinates={[0, 0]}
              initialZoom={2}
              onDelete={() => handleDeletePane(api.apiId)}
            />            
            ) : (
              <DashboardPane
                index={api.apiId}
                apiName={api.apiName}
                sizeX={api.paneX}
                sizeY={api.paneY}
                queryString={api.apiString}
                graphType={api.graphType || 'bar'}
                parameters={api.parameters || []}
                rootKeys={api.rootKeys || []}
                apiData={apiData.find((data) => data.apiId === api.apiId)?.data}
                onDelete={handleDeletePane}
              />
            )}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default Dashboard;