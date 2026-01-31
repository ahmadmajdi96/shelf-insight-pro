import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
  { name: 'Your Products', value: 34.5, color: 'hsl(168, 76%, 42%)' },
  { name: 'Competitor A', value: 28.2, color: 'hsl(222, 30%, 35%)' },
  { name: 'Competitor B', value: 21.3, color: 'hsl(222, 30%, 25%)' },
  { name: 'Other', value: 16.0, color: 'hsl(222, 30%, 18%)' },
];

export function ShareOfShelfChart() {
  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="font-semibold text-foreground mb-4">Share of Shelf Overview</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(222, 47%, 10%)', 
                border: '1px solid hsl(222, 30%, 18%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 96%)'
              }}
              formatter={(value: number) => [`${value}%`, 'Share']}
            />
            <Legend 
              verticalAlign="bottom"
              formatter={(value) => <span style={{ color: 'hsl(215, 20%, 55%)' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center">
        <p className="text-3xl font-bold text-primary">34.5%</p>
        <p className="text-sm text-muted-foreground">Your Share of Shelf</p>
      </div>
    </div>
  );
}
