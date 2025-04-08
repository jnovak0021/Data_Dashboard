import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ScatterPlot: React.FC<{ data: any, sizeX: number, sizeY: number, parameters: string[] }> = ({ data, sizeX, sizeY, parameters }) => {
  if (!data || data.length === 0) return <p>No data available</p>;

  // Extract relevant data based on parameters
  const chartData = parameters.map((param, index) => {
    const value = data.find((d: any) => d.Parameter === param.toUpperCase())?.AQI || 0;
    // Add a small random offset to x for visualization purposes
    // Using index as a seed for deterministic positioning
    return { 
      x: index + 1,  // Use index + 1 as x value for better visualization
      y: value, 
      z: 200,  // Size of the dot
      name: param.toUpperCase(),
      fill: COLORS[index % COLORS.length]
    };
  });

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
          name="Parameter" 
          tickFormatter={(value) => {
            const param = parameters[value - 1];
            return param ? param.toUpperCase() : '';
          }}
          domain={[0.5, parameters.length + 0.5]}
        />
        <YAxis type="number" dataKey="y" name="Value" />
        <ZAxis type="number" dataKey="z" range={[60, 400]} />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value, name, props) => {
            if (name === 'y') return [value, 'Value'];
            if (name === 'x') {
              const param = parameters[props.payload.x - 1];
              return [param ? param.toUpperCase() : '', 'Parameter'];
            }
            return [value, name];
          }}
        />
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
        <Scatter 
          name="Parameters" 
          data={chartData} 
          fill="#8884d8"
          shape="circle"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default ScatterPlot;