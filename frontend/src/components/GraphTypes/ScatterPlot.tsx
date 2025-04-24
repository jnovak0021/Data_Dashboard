import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis, Cell } from 'recharts';

// Consistent color palette across all graph types
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff5252', '#43a047'];

interface ScatterPlotProps {
  data: Record<string, any>[];
  sizeX: number;
  sizeY: number;
  parameters: string[];
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({ data, sizeX, sizeY, parameters }) => {
  if (!data || data.length === 0) return <div>No data available</div>;

  // Use first two parameters for coordinates and third for size (optional)
  const [xParam, yParam, sizeParam] = parameters;
  const xKey = xParam?.split('.').pop() || '';
  const yKey = yParam?.split('.').pop() || '';
  const sizeKey = sizeParam?.split('.').pop();

  // Format data for the chart
  const chartData = data.map((item, index) => {
    const point: any = {
      x: Number(item[xKey]) || 0,
      y: Number(item[yKey]) || 0,
      name: item.name || `Point ${index + 1}`,
      color: COLORS[index % COLORS.length]
    };

    if (sizeKey) {
      point.z = Number(item[sizeKey]) || 1;
    }

    return point;
  });

  // Calculate nice axis domains with padding
  const xValues = chartData.map(item => item.x);
  const yValues = chartData.map(item => item.y);
  
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const xPadding = (maxX - minX) * 0.1 || 1;
  
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yPadding = (maxY - minY) * 0.1 || 1;
  
  const xDomain = [minX - xPadding, maxX + xPadding];
  const yDomain = [minY - yPadding, maxY + yPadding];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number" 
          dataKey="x" 
          name={xKey}
          domain={xDomain}
          label={{ value: xKey, position: 'insideBottom', offset: -10 }}
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name={yKey}
          domain={yDomain}
          label={{ value: yKey, angle: -90, position: 'insideLeft' }}
        />
        {sizeKey && (
          <ZAxis 
            type="number" 
            dataKey="z" 
            range={[40, 200]} 
            name={sizeKey}
          />
        )}
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value, name, props) => {
            if (name === 'x') return [value, xKey];
            if (name === 'y') return [value, yKey];
            if (name === 'z') return [value, sizeKey];
            return [value, name];
          }}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            padding: '8px 12px',
          }}
        />
        <Legend
          layout="horizontal"
          verticalAlign="top"
          align="center"
          wrapperStyle={{
            paddingBottom: '20px'
          }}
        />
        <Scatter 
          name={`${xKey} vs ${yKey}`}
          data={chartData}
          fill="#8884d8"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default ScatterPlot;