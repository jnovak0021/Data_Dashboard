import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineGraphProps {
  data: Record<string, any>[];
  sizeX: number;
  sizeY: number;
  parameters: string[];
}

const LineGraph: React.FC<LineGraphProps> = ({ data, sizeX, sizeY, parameters }) => {
  if (!data || data.length === 0) return <div>No data available</div>;

  // Ensure parameters are valid
  if (!parameters || parameters.length < 2) {
    return <div>Invalid parameters. Please provide at least two parameters for the graph.</div>;
  }

  // Use the first parameter for x-axis and the second for y-axis
  const [xParam, yParam] = parameters;
  const xKey = xParam?.split('.').pop() || '';
  const yKey = yParam?.split('.').pop() || '';

  // Check if x values are timestamps or dates
  const isTimeAxis = data.some(item => {
    const value = item[xKey];
    if (typeof value === 'string') {
      return !isNaN(Date.parse(value));
    }
    return typeof value === 'number' && value > 1000000000;
  });

  // Format data for the chart
  let chartData = [...data]
    .sort((a, b) => {
      let aVal = a[xKey];
      let bVal = b[xKey];
      
      // Handle time/date sorting
      if (isTimeAxis) {
        const aTime = typeof aVal === 'string' ? new Date(aVal).getTime() : aVal;
        const bTime = typeof bVal === 'string' ? new Date(bVal).getTime() : bVal;
        return aTime - bTime;
      }
      
      // Handle numeric or string sorting
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal);
      }
      return (Number(aVal) || 0) - (Number(bVal) || 0);
    })
    .map(item => {
      const xValue = item[xKey];
      const yValue = Number(item[yKey]) || 0;
      
      return {
        x: isTimeAxis && typeof xValue === 'string' ? 
          new Date(xValue).toLocaleString() : xValue,
        y: yValue
      };
    });

  // If more than 20 data points, sample to prevent overcrowding
  if (chartData.length > 20) {
    const step = Math.ceil(chartData.length / 20);
    chartData = chartData.filter((_, index) => index % step === 0);
  }

  // Calculate nice Y axis domain
  const yValues = chartData.map(item => item.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const padding = (maxY - minY) * 0.1;
  const yDomain = [
    Math.max(0, minY - padding), // Don't go below zero unless data does
    maxY + padding
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="x"
          angle={-30}
          textAnchor="end"
          height={60}
          interval={chartData.length > 10 ? 'preserveStartEnd' : 0}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          domain={yDomain}
        />
        <Tooltip 
          formatter={(value) => [value, yKey]}
          labelFormatter={(label) => `${xKey}: ${label}`}
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
        <Line 
          type="monotone" 
          dataKey="y" 
          name={yKey}
          stroke="#8884d8" 
          strokeWidth={2}
          dot={{ stroke: '#8884d8', strokeWidth: 2, r: 4, fill: '#fff' }}
          activeDot={{ r: 6 }}
          animationDuration={500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineGraph;