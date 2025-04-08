import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const BarGraph: React.FC<{ data: any, sizeX: number, sizeY: number, parameters: string[] }> = ({ data, sizeX, sizeY, parameters }) => {
  if (!data || data.length === 0) return <p>No data available</p>;

  // Extract relevant data based on parameters
  const chartData = parameters.map(param => {
    const value = data.find((d: any) => d.Parameter === param.toUpperCase())?.AQI || 0;
    return { name: param.toUpperCase(), value };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
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
        <Bar dataKey="value" fill="#8884d8">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarGraph;