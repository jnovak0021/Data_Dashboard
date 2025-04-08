import React, { useEffect, useState, useRef } from 'react';
import { CiCircleMinus } from "react-icons/ci";
import PieGraph from './GraphTypes/PieGraph';
import LineGraph from './GraphTypes/LineGraph';
import ScatterPlot from './GraphTypes/ScatterPlot';
import BarGraph from './GraphTypes/BarGraph';


interface DashboardPaneProps {
  index: number;
  sizeX: number;
  sizeY: number;
  queryString: string;
  graphType: string;
  parameters?: string[];
  apiData: any;
  onDelete?: (id: number) => void;
}

const DashboardPane: React.FC<DashboardPaneProps> = ({ 
  index, 
  sizeX, 
  sizeY, 
  queryString, 
  graphType, 
  parameters,
  apiData,
  onDelete
}) => {
  const [data, setData] = useState<any | null>(null);
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

  // Fetch data if apiData is not provided
  useEffect(() => {
    if (apiData) {
      setData(apiData);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(queryString)
      .then(response => response.json())
      .then(jsonData => {
        // Filter and map the JSON data to extract relevant fields
        const filteredData = jsonData.map((d: any) => ({
          Parameter: d.Parameter,
          AQI: +d.AQI // Convert AQI to number
        }));
        
        setData(filteredData);
        console.log(filteredData);
        setLoading(false);
      })
      .catch(error => {
        setError(`Error: ${error.message}`);
        setLoading(false);
      });
  }, [queryString, apiData]);

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

  return (
    <div 
      ref={containerRef}
      className="pane relative w-full h-full border border-gray-300 bg-mainPink p-4 rounded-lg shadow overflow-hidden group"
    >
      {/* Delete button with explicit styling to ensure visibility */}
      {onDelete && (
        <button 
          className={`btn-delete absolute top-2 right-2 z-50 ${
            isDeleting ? 'bg-gray-500' : 'bg-red-500 hover:bg-red-700'
          } text-white rounded-full p-1 transition-colors opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed`}
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={isDeleting ? "Deleting..." : "Delete pane"}
        >
          <CiCircleMinus size={20} className={isDeleting ? 'animate-spin' : ''} />
        </button>
      )}
      
      {/* Main content */}
      <div className="w-full h-full flex items-center justify-center">
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : data ? (
          graphType === "pie" ? (
            <PieGraph 
              data={data} 
              sizeX={dimensions.width - 32} 
              sizeY={dimensions.height - 32} 
              parameters={parameters || []} 
            />
          ) : graphType === "line" ? (
            <LineGraph 
              data={data} 
              sizeX={dimensions.width - 32} 
              sizeY={dimensions.height - 32} 
              parameters={parameters || []} 
            />
          ) : graphType === "scatter" ? (
            <ScatterPlot 
              data={data} 
              sizeX={dimensions.width - 32} 
              sizeY={dimensions.height - 32} 
              parameters={parameters || []} 
            />
          ) : graphType === "bar" ? (
            <BarGraph 
              data={data} 
              sizeX={dimensions.width - 32} 
              sizeY={dimensions.height - 32} 
              parameters={parameters || []} 
            />
          ) : (
            <div className="text-center text-white">
              <p>Unsupported graph type: {graphType}</p>
              <p className="text-sm">Add support for this graph type in GraphTypes folder</p>
            </div>
          )
        ) : (
          <div>No data available</div>
        )}
      </div>
    </div>
  );
};

export default DashboardPane;