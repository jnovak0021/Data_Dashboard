import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const PieGraph: React.FC<{ data: any, sizeX: number, sizeY: number, parameters: string[] }> = ({ data, sizeX, sizeY, parameters }) => {
  if (!data || data.length === 0) return <p>No data available</p>;

  // Extract relevant data based on parameters
  const chartData = parameters.map(param => {
    const value = data.find((d: any) => d.Parameter === param.toUpperCase())?.AQI || 0;
    return { name: param.toUpperCase(), value };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius="45%"
          outerRadius="70%"
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{
            paddingTop: '20px',
            bottom: 10,
            width: '100%'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieGraph;
