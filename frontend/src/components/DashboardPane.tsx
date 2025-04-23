import React, { useEffect, useState, useRef } from 'react';
import { CiCircleMinus } from "react-icons/ci";
import { HelpCircle } from "lucide-react";
import PieGraph from './GraphTypes/PieGraph';
import LineGraph from './GraphTypes/LineGraph';
import ScatterPlot from './GraphTypes/ScatterPlot';
import BarGraph from './GraphTypes/BarGraph';
import { extractDataByRootKey, transformDataForVisualization, validateDataForVisualization } from '@/../utils/dataUtils';

interface DashboardPaneProps {
  index: number;
  sizeX: number;
  sizeY: number;
  queryString: string;
  graphType: string;
  parameters?: string[];
  apiData: any;
  rootKey: string;
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
  rootKey,
  apiName,
  onDelete
}) => {
  const [data, setData] = useState<Record<string, any>[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

        // Extract data based on root key
        const extractedData = extractDataByRootKey(jsonData, rootKey);
        if (!extractedData) {
          throw new Error(`Failed to extract data using root key: ${rootKey}`);
        }

        // Transform data for visualization
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
  }, [apiData, queryString, rootKey, parameters, graphType]);

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

  // Generate title based on parameters and graph type
  const getVisTitle = () => {
    if (parameters && parameters.length >= 2) {
      const displayParams = parameters.map(p => p.split('.').pop()).filter(Boolean);
      return `${displayParams[0]} vs ${displayParams[1]}`;
    }
    return apiName || 'Data Visualization';
  };

  return (
    <div 
      ref={containerRef}
      className="pane relative w-full h-full border border-gray-300 bg-white p-4 rounded-lg shadow overflow-hidden group transition-all hover:shadow-md"
    >
      {/* Delete button with explicit styling to ensure visibility */}
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
        {/* Title based on parameters or default */}
        <div className="mb-3 text-lg font-semibold text-gray-700">
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