import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', workflows: 4000, sales: 2400, views: 2400 },
  { name: 'Feb', workflows: 3000, sales: 1398, views: 2210 },
  { name: 'Mar', workflows: 2000, sales: 9800, views: 2290 },
  { name: 'Apr', workflows: 2780, sales: 3908, views: 2000 },
  { name: 'May', workflows: 1890, sales: 4800, views: 2181 },
  { name: 'Jun', workflows: 2390, sales: 3800, views: 2500 },
  { name: 'Jul', workflows: 3490, sales: 4300, views: 2100 },
];

const PerformanceChart = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Performance Analytics</h2>
      <p className="text-foreground-500 mb-4">Workflow execution trends and system metrics</p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="workflows" stackId="1" stroke="#8884d8" fill="#8884d8" />
          <Area type="monotone" dataKey="sales" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
          <Area type="monotone" dataKey="views" stackId="1" stroke="#ffc658" fill="#ffc658" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;