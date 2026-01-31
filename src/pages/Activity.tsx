import { Activity as ActivityIcon, ScanLine, Package, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';

const activityData = [
  { tenant: 'Coca-Cola', images: 847, skus: 48, trend: 'up' },
  { tenant: 'PepsiCo', images: 623, skus: 62, trend: 'up' },
  { tenant: 'Nestlé', images: 521, skus: 89, trend: 'down' },
  { tenant: 'Unilever', images: 412, skus: 23, trend: 'up' },
  { tenant: 'P&G', images: 234, skus: 45, trend: 'down' },
];

const chartData = [
  { name: 'Mon', images: 420 },
  { name: 'Tue', images: 380 },
  { name: 'Wed', images: 510 },
  { name: 'Thu', images: 590 },
  { name: 'Fri', images: 620 },
  { name: 'Sat', images: 340 },
  { name: 'Sun', images: 280 },
];

const recentActivity = [
  { id: 1, tenant: 'Coca-Cola', action: 'Processed 24 shelf images', time: '5 min ago', type: 'detection' },
  { id: 2, tenant: 'PepsiCo', action: 'Added 3 new SKUs', time: '1 hour ago', type: 'product' },
  { id: 3, tenant: 'Nestlé', action: 'Completed training for 5 SKUs', time: '2 hours ago', type: 'training' },
  { id: 4, tenant: 'Coca-Cola', action: 'Processed 18 shelf images', time: '3 hours ago', type: 'detection' },
  { id: 5, tenant: 'Unilever', action: 'Added new store location', time: '5 hours ago', type: 'store' },
];

export default function Activity() {
  return (
    <MainLayout 
      title="Tenant Activity" 
      subtitle="Monitor usage and activity across all tenants."
      userRole="admin"
    >
      {/* Weekly Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-xl bg-card border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Weekly Image Processing</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(222, 47%, 10%)', 
                    border: '1px solid hsl(222, 30%, 18%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 96%)'
                  }}
                />
                <Bar 
                  dataKey="images" 
                  fill="hsl(168, 76%, 42%)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">This Week</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-3xl font-bold text-primary">3,140</p>
              <p className="text-sm text-muted-foreground">Total Images Processed</p>
              <span className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +12% vs last week
              </span>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-3xl font-bold text-foreground">267</p>
              <p className="text-sm text-muted-foreground">SKUs Trained</p>
              <span className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +8 new this week
              </span>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-3xl font-bold text-foreground">5</p>
              <p className="text-sm text-muted-foreground">Active Tenants</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Leaderboard */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Tenant Usage (This Month)</h3>
          </div>
          <div className="divide-y divide-border">
            {activityData.map((tenant, index) => (
              <div 
                key={tenant.tenant}
                className={cn(
                  "p-4 hover:bg-secondary/50 transition-colors",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{tenant.tenant}</p>
                      <p className="text-sm text-muted-foreground">
                        {tenant.skus} SKUs trained
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{tenant.images.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                      {tenant.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-success" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-destructive" />
                      )}
                      images
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {recentActivity.map((activity, index) => (
              <div 
                key={activity.id}
                className={cn(
                  "p-4 hover:bg-secondary/50 transition-colors",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    activity.type === 'detection' && "bg-primary/10 text-primary",
                    activity.type === 'product' && "bg-success/10 text-success",
                    activity.type === 'training' && "bg-warning/10 text-warning",
                    activity.type === 'store' && "bg-secondary text-muted-foreground",
                  )}>
                    {activity.type === 'detection' && <ScanLine className="w-4 h-4" />}
                    {activity.type === 'product' && <Package className="w-4 h-4" />}
                    {activity.type === 'training' && <ActivityIcon className="w-4 h-4" />}
                    {activity.type === 'store' && <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{activity.tenant}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
