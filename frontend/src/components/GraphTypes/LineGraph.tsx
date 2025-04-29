import React, { useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];
interface GraphProps {
  data: Record<string, any>[];
  sizeX: number;
  sizeY: number;
  parameters: string[];
}

const LineGraph: React.FC<GraphProps> = ({ data, parameters }) => {
  console.log("LineGraph data:", data); // Log the data passed to the LineGraph

  if (!data || data.length === 0) return <div>No data available</div>;
  if (!parameters || parameters.length < 2) {
    return <div>Invalid parameters. Please provide at least two parameters.</div>;
  }

  const getParameterName = (param: string | { parameter: string }): string => {
    if (typeof param === 'string') return param;
    return param.parameter;
  };
  
  const [xParam, ...yParams] = parameters.map(getParameterName);

  const getPathLastSegment = (path: string): string => {
    const parts = path.split('.');
    return parts[parts.length - 1];
  };

  const getDisplayName = (param: string): string => {
    if (param.includes('.')) {
      return getPathLastSegment(param);
    }
    return param;
  };

  const getValue = (item: Record<string, any>, param: string): any => {
    if (item[param] !== undefined) {
      return item[param];
    }
    
    const paramName = getPathLastSegment(param);
    const matchingKey = Object.keys(item).find(key => 
      key.endsWith(`.${paramName}`) || key === paramName
    );
    
    return matchingKey ? item[matchingKey] : undefined;
  };

  const isTimeAxis = data.some(item => {
    const value = getValue(item, xParam);
    return (typeof value === 'string' && !isNaN(Date.parse(value))) ||
           (typeof value === 'number' && value > 1000000000);
  });

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
    .filter(item => item.xValue !== undefined)
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

  let sampledViewModel = chartViewModel;
  if (chartViewModel.length > 20) {
    const step = Math.ceil(chartViewModel.length / 20);
    sampledViewModel = chartViewModel.filter((_, index) => index % step === 0);
  }

  const chartData = sampledViewModel.map(item => {
    const point: Record<string, any> = {
      originalData: item.originalData,
      x: isTimeAxis && typeof item.xValue === 'string' 
        ? new Date(item.xValue).toLocaleString() 
        : item.xValue
    };

    item.yValues.forEach(({ param, value }) => {
      const paramKey = getDisplayName(param);
      point[paramKey] = Number(value) || 0;
      point[`${paramKey}_fullPath`] = param;
    });

    return point;
  });

  const allYValues = sampledViewModel.flatMap(item => 
    item.yValues.map(y => y.value)
  ).map(v => Number(v) || 0);
  
  const minY = Math.min(...allYValues);
  const maxY = Math.max(...allYValues);
  const padding = (maxY - minY) * 0.1;
  const yDomain = [Math.max(0, minY - padding), maxY + padding];

  const displayParams = yParams.map(getDisplayName);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="x"
          label={{ value: getDisplayName(xParam), position: 'insideBottomRight', offset: -10 }}
          angle={-30}
          textAnchor="end"
          height={60}
          interval={chartData.length > 10 ? 'preserveStartEnd' : 0}
          tick={{ fontSize: 12 }}
        />
        <YAxis domain={yDomain} />
        <Tooltip 
          formatter={(value: any, name: string) => {
            return [value, name];
          }}
          labelFormatter={(label: string) => `${getDisplayName(xParam)}: ${label}`}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            padding: '8px 12px',
          }}
        />
        <Legend
          formatter={(value: string) => value}
          layout="horizontal"
          verticalAlign="top"
          align="center"
          wrapperStyle={{ paddingBottom: '20px' }}
        />
        {displayParams.map((displayParam, index) => (
          <Line
            key={displayParam}
            type="monotone"
            dataKey={displayParam}
            name={displayParam}
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
    </ResponsiveContainer>
  );
};

export default LineGraph;