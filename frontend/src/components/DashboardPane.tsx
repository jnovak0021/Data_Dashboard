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
  normalizeRootKeys
} from '@/../utils/dataUtils';
import APIFormDialog from './APIFormDialog';
interface DashboardPaneProps {
  index: number;
  sizeX: number;
  sizeY: number;
  queryString: string;
  graphType: string;
  parameters: (string | { parameter: string })[];
  apiData: any;
  rootKeys: string[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stringParams,setStringParams] = useState<string[]>([]);
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE;  //contant for the baseURL

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    const processApiData = async () => {
      try {
        setLoading(true);
        let jsonData = apiData;

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

        if (!jsonData) {
          throw new Error("No data source provided");
        }

        const formattedRootKeys = normalizeRootKeys(rootKeys);
        
        let extractedData;

        if (formattedRootKeys.length > 1) {
          extractedData = extractDataByMultipleRootKeys(jsonData, formattedRootKeys);
        } else if (formattedRootKeys.length === 1) {
          extractedData = extractDataByRootKey(jsonData, formattedRootKeys[0]);
          
          if (!extractedData && jsonData) {
            extractedData = jsonData;
            console.warn("Root key extraction failed, using entire JSON");
          }
        } else {
          extractedData = jsonData;
        }
        
        if (!extractedData) {
          throw new Error("Failed to extract data from JSON");
        }

        const normalizedParams = parameters.map(p => 
          typeof p === 'string' ? p : p.parameter
        );
        //removes all falsy data
        setStringParams(normalizedParams);
        console.log("NROMALIZED");
        console.log(normalizedParams);
        console.log("EXTRACTED DATA");
        console.log(extractedData);

        const transformedData = transformDataForVisualization(extractedData, normalizedParams);

        if (!transformedData || transformedData.length === 0) {
          throw new Error("Failed to transform data for visualization");
        }

        console.log("Transformed data:", transformedData);
        console.log("Using parameters:", normalizedParams);
        
        const validationError = validateDataForVisualization(transformedData, graphType, normalizedParams);
        if (validationError) {
          throw new Error(validationError);
        }

        setData(extractedData);
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
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!onDelete || isDeleting) return;

    setIsDeleting(true);
    console.log(`Attempting to delete pane with index: ${index}`);

    try {
      const response = await fetch(`${BASE_URL}/api/go/deleteAPI/${index}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting API: ${response.statusText}`);
      }
      
      console.log(`Successfully deleted API ${index} from backend`);
      onDelete(index);
    } catch (error) {
      console.error('Failed to delete API:', error);
      setError('Failed to delete pane. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getParameterName = (param: string | { parameter: string }): string => {
    if (typeof param === 'string') return param;
    return param.parameter;
  };

  const getVisTitle = () => {
    if (parameters && parameters.length >= 2) {
      const displayParams = parameters.map(param => {
        const paramStr = getParameterName(param);
        return paramStr.split('.').pop() || '';
      });
      return `${displayParams[0]} vs ${displayParams[1]}`;
    }
    return apiName || 'Data Visualization';
  };

  return (
    <div 
      ref={containerRef}
      className="pane relative w-full h-full border border-gray-300 bg-white p-4 rounded-lg shadow overflow-hidden group transition-all hover:shadow-md"
    >
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
      
      <div className="w-full h-full flex flex-col">
        <div className="mb-3 text-lg font-bold text-gray-700"> 
          {apiName}
        </div>
        
        <div className="mb-3 text-md font-semibold text-gray-700">
          {getVisTitle()}
        </div>
      
        <div className="flex-1 flex items-center justify-center">
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
            // graphType ===
            graphType === "pie" ? (
              <PieGraph 
                data={data} 
                sizeX={dimensions.width - 32} 
                sizeY={dimensions.height - 70} 
                parameters={parameters} 
              />
            ) : graphType === "line" ? (
              <LineGraph 
                data={data} 
                sizeX={dimensions.width - 32} 
                sizeY={dimensions.height - 70} 
                parameters={stringParams} 
              />
            ) : graphType === "scatter" ? (
              <ScatterPlot 
                data={data} 
                sizeX={dimensions.width - 32} 
                sizeY={dimensions.height - 70} 
                parameters={stringParams} 
              />
            ) : graphType === "bar" ? (
              <BarGraph 
                data={data} 
                sizeX={dimensions.width - 32} 
                sizeY={dimensions.height - 70} 
                parameters={stringParams} 
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