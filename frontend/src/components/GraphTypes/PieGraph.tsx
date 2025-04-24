import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Consistent color palette across all graph types
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff5252', '#43a047'];

interface PieGraphProps {
  data: Record<string, any>[];
  sizeX: number;
  sizeY: number;
  parameters: string[];
}

const PieGraph: React.FC<PieGraphProps> = ({ data, sizeX, sizeY, parameters }) => {
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
  })).filter(item => item.value > 0); // Only include items with positive values

  // If no valid data points, show message
  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No valid data points to display</div>;
  }

  // Calculate total for percentage display
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={sizeY > 200 ? "45%" : "35%"}
          outerRadius={sizeY > 200 ? "70%" : "60%"}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          label={({ name, value }) => `${name}: ${((value / total) * 100).toFixed(1)}%`}
          labelLine={true}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name, props) => [
            `${value} (${((Number(value) / total) * 100).toFixed(1)}%)`,
            props.payload.name
          ]}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            padding: '8px 12px',
          }}
        />
        {/* <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{
            paddingTop: '10px',
            fontSize: '12px',
          }}
        /> */}
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieGraph;