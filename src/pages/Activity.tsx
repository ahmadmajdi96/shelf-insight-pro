import { Activity as ActivityIcon, ScanLine, Package, Clock, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { useActivity } from '@/hooks/useActivity';

export default function Activity() {
  const { activityData, chartData, recentActivity, totalImages, totalSkus, activeTenants, isLoading } = useActivity();

  if (isLoading) {
    return (
      <MainLayout title="Tenant Activity" subtitle="Monitor usage and activity across all tenants.">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Tenant Activity" 
      subtitle="Monitor usage and activity across all tenants."
    >
      {/* Weekly Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-xl bg-card border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Weekly Image Processing</h3>
          <div className="h-[250px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar dataKey="images" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No weekly data available yet
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">This Month</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-3xl font-bold text-primary">{totalImages.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Images Processed</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-3xl font-bold text-foreground">{totalSkus}</p>
              <p className="text-sm text-muted-foreground">SKUs Trained</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-3xl font-bold text-foreground">{activeTenants}</p>
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
          {activityData.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No tenant data available</div>
          ) : (
            <div className="divide-y divide-border">
              {activityData.map((tenant, index) => (
                <div 
                  key={tenant.tenantId}
                  className={cn("p-4 hover:bg-secondary/50 transition-colors", "animate-fade-in")}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{tenant.tenant}</p>
                        <p className="text-sm text-muted-foreground">{tenant.skus} SKUs trained</p>
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
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
          </div>
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No recent activity</div>
          ) : (
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {recentActivity.map((activity, index) => (
                <div 
                  key={activity.id}
                  className={cn("p-4 hover:bg-secondary/50 transition-colors", "animate-fade-in")}
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
          )}
        </div>
      </div>
    </MainLayout>
  );
}
