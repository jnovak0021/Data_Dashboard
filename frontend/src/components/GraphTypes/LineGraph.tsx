import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Color palette for multiple lines
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

interface LineGraphProps {
  data: Record<string, any>[];
  sizeX: number;
  sizeY: number;
  parameters: string[];
}

const LineGraph: React.FC<LineGraphProps> = ({ data, sizeX, sizeY, parameters }) => {
  if (data.length > 0)
    {
      return <div><div>DATA: </div>{JSON.stringify(data)}</div>
    }
    
  if (!data || data.length === 0) return <div>No data available<div><div>DATA: </div>{JSON.stringify(data)}</div></div>;
  if (!parameters || parameters.length < 2) {
    return <div>Invalid parameters. Please provide at least two parameters.</div>;
  }
  const getParameterName = (param: string | { parameter: string }) => {
    if (typeof param === 'string') return param;
    return param.parameter;
  };
  
  // Extract x-axis parameter (first parameter) and all y-axis parameters (remaining parameters)
  const [xParam, ...yParams] = parameters;
const xKey = getParameterName(xParam)?.split('.').pop() || '';
// Removed unused yKey as it references undefined yParam


  // Function to get the actual value from potentially nested data
  const getValue = (item: any, param: string): any => {
    return param.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), item);
  };

  // Check if x values are timestamps/dates
  const isTimeAxis = data.some(item => {
    const value = getValue(item, xParam);
    return (typeof value === 'string' && !isNaN(Date.parse(value))) ||
           (typeof value === 'number' && value > 1000000000);
  });

  

  

  // Create a view-model for the chart while preserving original data
  const chartViewModel = data
    .map((item, index) => ({
      originalData: item,
      index,
      xValue: getValue(item, xParam),
      yValues: yParams.map(param => ({
        param,
        value: getValue(item, param)
      }))
    }))
    .sort((a, b) => {
      if (isTimeAxis) {
        const aTime = typeof a.xValue === 'string' ? new Date(a.xValue).getTime() : a.xValue;
        const bTime = typeof b.xValue === 'string' ? new Date(b.xValue).getTime() : b.xValue;
        return aTime - bTime;
      }
      
      if (typeof a.xValue === 'string' && typeof b.xValue === 'string') {
        return a.xValue.localeCompare(b.xValue);
      }
      return (Number(a.xValue) || 0) - (Number(b.xValue) || 0);
    });

  // Sample data if too many points while preserving original data
  let sampledViewModel = chartViewModel;
  if (chartViewModel.length > 20) {
    const step = Math.ceil(chartViewModel.length / 20);
    sampledViewModel = chartViewModel.filter((_, index) => index % step === 0);
  }

  // Create the chart data format required by Recharts
  const chartData = sampledViewModel.map(item => {
    const point: Record<string, any> = {
      originalData: item.originalData,
      x: isTimeAxis && typeof item.xValue === 'string' 
        ? new Date(item.xValue).toLocaleString() 
        : item.xValue
    };

    item.yValues.forEach(({ param, value }) => {
      point[param] = Number(value) || 0;
    });

    return point;
  });

  // Calculate Y axis domain across all y parameters
  const allYValues = sampledViewModel.flatMap(item => 
    item.yValues.map(y => y.value)
  ).map(v => Number(v) || 0);
  
  const minY = Math.min(...allYValues);
  const maxY = Math.max(...allYValues);
  const padding = (maxY - minY) * 0.1;
  const yDomain = [Math.max(0, minY - padding), maxY + padding];

  // Get display names for parameters
  const getDisplayName = (param: string): string => {
    const parts = param.split('.');
    return parts[parts.length - 1];
  };

  return (
    
    <ResponsiveContainer width="100%" height="100%">
      <>
      {JSON.stringify(data)}
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
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
        <YAxis domain={yDomain} />
        <Tooltip 
          formatter={(value, name, props) => {
            const displayName = getDisplayName(String(name));
            // Access original data in tooltip if needed
            const originalData = props.payload.originalData;
            return [value, displayName];
          }}
          labelFormatter={(label) => `${getDisplayName(xParam)}: ${label}`}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            padding: '8px 12px',
          }}
        />
        <Legend
          formatter={(value) => getDisplayName(String(value))}
          layout="horizontal"
          verticalAlign="top"
          align="center"
          wrapperStyle={{ paddingBottom: '20px' }}
        />
        {yParams.map((param, index) => (
          <Line
            key={param}
            type="monotone"
            dataKey={param}
            name={param}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={2}
            dot={{ 
              stroke: COLORS[index % COLORS.length], 
              strokeWidth: 2, 
              r: 4, 
              fill: '#fff' 
            }}
            activeDot={{ r: 6 }}
            animationDuration={500}
          />
        ))}
      </LineChart>
      </>
    </ResponsiveContainer>
  );
};

export default LineGraph;