import React, { useEffect, useState } from 'react';
import PieGraph from './GraphTypes/PieGraph';

interface DashboardPaneProps {
  index: number;
  sizeX: number;
  sizeY: number;
  queryString: string;
  graphType: string;
  parameters?: string[];
  apiData: any;
}

const DashboardPane: React.FC<DashboardPaneProps> = ({ index, sizeX, sizeY, queryString, graphType, parameters }) => {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
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
      })
      .catch(error => setData(`Error: ${error.message}`));
  }, [queryString]);

  return (
    <div
      className="pane border border-gray-300 bg-mainPink p-4 m-2 flex items-center justify-center"
      style={{ 
        width: `${sizeX}px`, 
        height: `${sizeY}px`,
        overflow: 'hidden'
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        {data ? (
          graphType === "pie" ? (
            <PieGraph data={data} sizeX={sizeX - 32} sizeY={sizeY - 32} parameters={parameters || []} />
          ) : (
            <p>Unsupported graph type</p>
          )
        ) : (
          'Loading...'
        )}
      </div>
    </div>
  );
};

export default DashboardPane;