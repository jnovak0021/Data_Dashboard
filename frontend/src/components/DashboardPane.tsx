import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface DashboardPaneProps {
  index: number;
  sizeX: number;
  sizeY: number;
  queryString: string;
  graphType: string;
  parameters?: string[];
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

const AirQualityPieChart: React.FC<{ data: any, sizeX: number, sizeY: number, parameters: string[] }> = ({ data, sizeX, sizeY, parameters }) => {
  if (!data || data.length === 0) return <p>No data available</p>;

  // Extract relevant data based on parameters
  const chartData = parameters.map(param => {
    const value = data.find((d: any) => d.Parameter === param.toUpperCase())?.AQI || 0;
    return { name: param.toUpperCase(), value };
  });

  return (
    <PieChart width={sizeX / 2} height={sizeY / 2}>
      <Pie
        data={chartData}
        cx={(sizeX / 4)}
        cy={(sizeY / 4)}
        innerRadius={sizeX / 10}
        outerRadius={sizeX / 5}
        fill="#8884d8"
        paddingAngle={5}
        dataKey="value"
      >
        {chartData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
};

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
      className="pane border border-gray-300 bg-mainPink p-4 m-2 overflow-auto"
      style={{ width: `${sizeX}px`, height: `${sizeY}px` }}
    >
      {data ? (
        graphType === "pie" ? (
          <AirQualityPieChart data={data} sizeX={sizeX} sizeY={sizeY} parameters={parameters || []} />
        ) : (
          <p>Unsupported graph type</p>
        )
      ) : (
        'Loading...'
      )}
    </div>
  );
};

export default DashboardPane;