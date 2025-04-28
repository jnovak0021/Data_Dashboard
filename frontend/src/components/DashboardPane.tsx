import React, { useEffect, useState, useRef } from 'react';
import { CiCircleMinus } from "react-icons/ci";
import { MdModeEdit } from "react-icons/md";
import PieGraph from './GraphTypes/PieGraph';
import LineGraph from './GraphTypes/LineGraph';
import ScatterPlot from './GraphTypes/ScatterPlot';
import BarGraph from './GraphTypes/BarGraph';
import { 
  extractDataByRootKey, 
  extractDataByMultipleRootKeys, 
  transformDataForVisualization, 
  validateDataForVisualization,
  RootKeyData 
} from '@/../utils/dataUtils';
import APIFormDialog from './APIFormDialog';

interface DashboardPaneProps {
  index: number;
  sizeX: number;
  sizeY: number;
  queryString: string;
  graphType: string;
  parameters: string[];
  apiData: any;
  rootKeys: RootKeyData[] | string[]; // Support both new and old format
  apiName?: string;
  onDelete?: (id: number) => void;
}

const DashboardPane: React.FC<DashboardPaneProps> = ({ 
  index, 
  sizeX, 
  sizeY, 
  queryString, 
  graphType, 
  parameters = [],
  apiData,
  rootKeys = [],
  apiName,
  onDelete
}) => {
  const [data, setData] = useState<Record<string, any>[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    // Initial dimensions
    updateDimensions();

    // Update dimensions on resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Update on window resize as well
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

//   useEffect(() => {
//   console.log("===== Printing rootKeys =====");

//   if (Array.isArray(rootKeys)) {
//     rootKeys.forEach((rk, idx) => {
//       if (typeof rk === 'string') {
//         console.log(`RootKey ${idx}: key = ${rk}, path = ${rk}`);
//       } else if (typeof rk === 'object' && 'key' in rk && 'path' in rk) {
//         console.log(`RootKey ${idx}: key = ${rk.key}, path = ${rk.path}`);
//       } else {
//         console.log(`RootKey ${idx}: Unexpected format`, rk);
//       }
//     });
//   } else {
//     console.log('rootKeys is not an array:', rootKeys);
//   }

//   console.log("===== Printing parameters =====");

//   if (Array.isArray(parameters)) {
//     parameters.forEach((param, idx) => {
//       if (typeof param === 'string') {
//         console.log(`Parameter ${idx}: ${param}`);
//       } else if (typeof param === 'object' && 'parameter' in param) {
//         console.log(`Parameter ${idx}: ${param.parameter}`);
//       } else {
//         console.log(`Parameter ${idx}: Unexpected format`, param);
//       }
//     });
//   } else {
//     console.log('parameters is not an array:', parameters);
//   }
// }, [rootKeys, parameters]);


  // Process the API data or fetch from queryString
  useEffect(() => {
    const processApiData = async () => {
      try {
        setLoading(true);
        let jsonData = apiData;

        // If no apiData provided but we have a queryString, fetch the data
        if (!jsonData && queryString) {
          try {
            const response = await fetch(queryString);
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            jsonData = await response.json();
          } catch (fetchError) {
            throw new Error(`Failed to fetch data: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
          }
        }

        // If still no data, show error
        if (!jsonData) {
          throw new Error("No data source provided");
        }

        // Convert old string rootKeys format to new RootKeyData format if needed
        let formattedRootKeys: RootKeyData[] = [];
        if (rootKeys.length > 0) {
          if (typeof rootKeys[0] === 'string') {
            // Old format - convert to new format
            formattedRootKeys = (rootKeys as string[]).map(key => ({ key, path: key }));
          } else {
            // Already in new format
            formattedRootKeys = rootKeys as RootKeyData[];
          }
        }

        let extractedData;
        
        // Handle multiple root keys if available
        if (formattedRootKeys.length > 1) {
          // Extract data using multiple root keys
          extractedData = extractDataByMultipleRootKeys(jsonData, formattedRootKeys);
          
          // Merge root data as needed for visualization
          // The transformDataForVisualization function will handle combining data from multiple roots
        } else if (formattedRootKeys.length === 1) {
          // Single root key
          extractedData = extractDataByRootKey(jsonData, formattedRootKeys[0]);
        } else {
          // No root keys, use entire JSON
          extractedData = jsonData;
        }
        
        if (!extractedData) {
          throw new Error("Failed to extract data from JSON");
        }

        // Transform data for visualization with full parameter paths
        const transformedData = transformDataForVisualization(extractedData, parameters);
        
        // Validate data for the specific graph type
        const validationError = validateDataForVisualization(transformedData, graphType, parameters);
        if (validationError) {
          throw new Error(validationError);
        }

        setData(transformedData);
        setError(null);
      } catch (error) {
        console.error('Error processing data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    processApiData();
  }, [apiData, queryString, rootKeys, parameters, graphType]);

  const handleFormSubmit = () => {
    setIsDialogOpen(false);
    // Refresh data or update pane as needed
  };

  // Handle delete button click
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!onDelete || isDeleting) return;

    setIsDeleting(true);
    console.log(`Attempting to delete pane with index: ${index}`);

    try {
      // First try to delete from backend
      const response = await fetch(`http://localhost:8000/api/go/deleteAPI/${index}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting API: ${response.statusText}`);
      }
      
      console.log(`Successfully deleted API ${index} from backend`);
      
      // If backend delete successful, update frontend
      onDelete(index);
    } catch (error) {
      console.error('Failed to delete API:', error);
      setError('Failed to delete pane. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // // Get display name for a parameter, stripping any root key prefix
  // const getParameterDisplayName = (param: string): string => {
  //   const parts = param.split('.');
  //   return parts[parts.length - 1];
  // };
  const getParameterName = (param: string | { parameter: string }) => {
    if (typeof param === 'string') return param;
    return param.parameter;
  };
  // Generate title based on parameters and graph type
  const getVisTitle = () => {
    if (parameters && parameters.length >= 2) {
      const displayParams = parameters.map(param => getParameterName(param).split('.').pop() || '');
      return `${displayParams[0]} vs ${displayParams[1]}`;
    }
    return apiName || 'Data Visualization';
  };

  return (
    <div 
      ref={containerRef}
      className="pane relative w-full h-full border border-gray-300 bg-white p-4 rounded-lg shadow overflow-hidden group transition-all hover:shadow-md"
    >
      
      {/* Edit button */}
      <span className="absolute top-2 right-10 z-50 bg-blue-500 hover:bg-blue-700 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100">
        <button onClick={() => setIsDialogOpen(true)}>
          <MdModeEdit size={20} />
        </button>
      </span>

      {isDialogOpen && (
        <APIFormDialog 
          onFormSubmit={handleFormSubmit} 
          editMode={true} 
        />
      )}
      
      {/* Delete button */}
      {onDelete && (
        <button 
          className={`btn-delete absolute top-2 right-2 z-50 ${
            isDeleting ? 'bg-gray-500' : 'bg-red-500 hover:bg-red-700'
          } text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed`}
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={isDeleting ? "Deleting..." : "Delete pane"}
        >
          <CiCircleMinus size={20} className={isDeleting ? 'animate-spin' : ''} />
        </button>
      )}
      
      {/* Main content */}
      <div className="w-full h-full flex flex-col">
        <div className="mb-3 text-lg font-bold text-gray-700"> 
          {apiName}
        </div>
        
        <div className="mb-3 text-md font-semibold text-gray-700">
          {/* {getVisTitle()} */}
        </div>
      
        <div className="flex-1 flex items-center justify-center">
          ROOTS:
          
          JSON:
          {JSON.stringify(data)}
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 text-center">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          ) : data && data.length > 0 ? (
            graphType === "pie" ? (
              <PieGraph 
                data={data} 
                sizeX={dimensions.width - 32} 
                sizeY={dimensions.height - 70} 
                parameters={parameters || []} 
              />
            ) : graphType === "line" ? (
              <LineGraph 
                data={data} 
                sizeX={dimensions.width - 32} 
                sizeY={dimensions.height - 70} 
                parameters={parameters || []} 
              />
            ) : graphType === "scatter" ? (
              <ScatterPlot 
                data={data} 
                sizeX={dimensions.width - 32} 
                sizeY={dimensions.height - 70} 
                parameters={parameters || []} 
              />
            ) : graphType === "bar" ? (
              <BarGraph 
                data={data} 
                sizeX={dimensions.width - 32} 
                sizeY={dimensions.height - 70} 
                parameters={parameters || []} 
              />
            ) : (
              <div className="text-center text-gray-700">
                <p>Unsupported graph type: {graphType}</p>
                <p className="text-sm">Add support for this graph type in GraphTypes folder</p>
              </div>
            )
          ) : (
            <div className="text-center text-gray-700">
              <p>No data available to display</p>
              <p className="text-sm">Please check your data source or parameters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPane;