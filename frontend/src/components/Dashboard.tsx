import React, { useEffect, useState } from 'react';
import DashboardPane from './DashboardPane';
import { fetchUserId } from "../../utils/auth";


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

interface DashboardProps {
  customLayout?: boolean;
  refresh: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ refresh /*customLayout = false*/ }) => {
  const [apis, setApis] = useState<APIData[]>([]);
  const [apiData, setApiData] = useState<{ apiId: number; data: any }[]>([]); // To store the fetched data for each API
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState(0)

  // Fetch the list of APIs
  useEffect(() => {
    const fetchAPIs = async () => {
      try {
        const fetchedUserId = await fetchUserId(); // Await the user ID
        if (fetchedUserId === null) {
          throw new Error('Failed to fetch user ID');
        }
        setUserId(fetchedUserId);

        const response = await fetch(`http://localhost:8000/api/go/apis/${fetchedUserId}`);
        if (!response.ok) {
          throw new Error(`Error fetching APIs: ${response.statusText}`);
        }
        const data: APIData[] = await response.json();
        console.log('Fetched APIs:', data);
        setApis(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAPIs();
  }, [refresh]);



  // Fetch data for each API
  useEffect(() => {
    const getApiData = async (api: APIData) => {
      try {
        const response = await fetch(api.apiString);
        if (!response.ok) {
          throw new Error(`Error fetching data for API ${api.apiId}: ${response.statusText}`);
        }
        const data = await response.json();
        return { apiId: api.apiId, data }; // Return the API ID and its data
      } catch (err: any) {
        console.error(`Error fetching data for API ${api.apiId}:`, err.message);
        return { apiId: api.apiId, data: null }; // Return null data in case of an error
      }
    };

    const fetchAllApiData = async () => {
      if (apis.length > 0) {
        try {
          const results = await Promise.all(apis.map((api) => getApiData(api)));
          console.log('Fetched API Data:', results);
          setApiData(results); // Store the fetched data
        } catch (err) {
          console.error('Error fetching API data:', err);
        }
      }
    };

    fetchAllApiData();
  }, [apis]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="overflow-auto">
      <div className="dashboard-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {apis.map((api) => {
          console.log("Parameters: " + api.parameters);
          const apiSpecificData = apiData.find((data) => data.apiId === api.apiId)?.data; // Find the data for this API
          return (
            <DashboardPane
              key={api.apiId}
              index={api.apiId}
              sizeX={api.paneX}
              sizeY={api.paneY}
              queryString={api.apiString}
              graphType={api.graphType || 'pie'}
              parameters={api.parameters?.map((p) => (typeof p === 'object' && 'parameter' in p ? p.parameter : p)) || []} // Safely extract parameter strings
              apiData={apiSpecificData}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;