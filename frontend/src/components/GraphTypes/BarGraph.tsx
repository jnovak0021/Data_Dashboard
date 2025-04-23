import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Consistent color palette across all graph types
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff5252', '#43a047'];

interface BarGraphProps {
  data: Record<string, any>[];
  sizeX: number;
  sizeY: number;
  parameters: string[];
}

const BarGraph: React.FC<BarGraphProps> = ({ data, sizeX, sizeY, parameters }) => {
  if (!data || data.length === 0) return <div>No data available</div>;

  // Use the first parameter for labels and the second for values
  const [labelParam, valueParam] = parameters;
  const labelKey = labelParam?.split('.').pop() || '';
  const valueKey = valueParam?.split('.').pop() || '';

  // Format data for the chart
  const chartData = data.map((item, index) => ({
    name: typeof item[labelKey] === 'string' ? 
      item[labelKey].substring(0, 20) : // Truncate long labels
      String(item[labelKey] || `Item ${index}`),
    value: Number(item[valueKey]) || 0,
    color: COLORS[index % COLORS.length]
  }));

  // Calculate max value for Y axis padding
  const maxValue = Math.max(...chartData.map(item => item.value));
  const yAxisDomain = [0, Math.ceil(maxValue * 1.1)]; // Add 10% padding to top

  // Calculate appropriate label angle based on number of bars
  const labelAngle = chartData.length > 5 ? -45 : 0;
  const labelTextAnchor = labelAngle !== 0 ? "end" : "middle";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: chartData.length > 5 ? 60 : 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          angle={labelAngle}
          textAnchor={labelTextAnchor}
          height={60}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          domain={yAxisDomain}
          allowDecimals={false}
        />
        <Tooltip 
          formatter={(value) => [`${value}`, valueKey]}
          labelFormatter={(label) => `${labelKey}: ${label}`}
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
        <Bar dataKey="value" name={valueKey}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarGraph;