import { ScanLine, Package, Store, TrendingUp, ImageIcon, CheckCircle2, Loader2, Building2, LayoutGrid, ArrowUpRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useStores } from '@/hooks/useStores';
import { useQuota } from '@/hooks/useQuota';
import { useTenants } from '@/hooks/useTenants';
import { useShelves } from '@/hooks/useShelves';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { products, isLoading: productsLoading } = useProducts();
  const { stores, isLoading: storesLoading } = useStores();
  const { quota, monthlyPercentage, isLoading: quotaLoading } = useQuota();
  const { tenants } = useTenants();
  const { shelves } = useShelves();

  const isLoading = productsLoading || storesLoading || quotaLoading;

  const trainedCount = products.filter(p => p.training_status === 'completed').length;
  const trainingCount = products.filter(p => p.training_status === 'training').length;
  const pendingCount = products.filter(p => p.training_status === 'pending').length;
  const activeTenants = tenants.filter(t => t.is_active).length;

  const stats = [
    { label: 'Tenants', value: tenants.length, sub: `${activeTenants} active`, icon: Building2, href: '/tenants' },
    { label: 'Stores', value: stores.length, sub: 'Monitored', icon: Store, href: '/management' },
    { label: 'Products', value: products.length, sub: `${trainedCount} trained`, icon: Package, href: '/products' },
    { label: 'Shelves', value: shelves.length, sub: 'Configured', icon: LayoutGrid, href: '/management' },
  ];

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle={`Welcome back${profile?.fullName ? `, ${profile.fullName}` : ''}!`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/management')} className="btn-glow">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Manage Shelves
            </Button>
            <Button variant="outline" onClick={() => navigate('/products')}>
              <Package className="w-4 h-4 mr-2" />
              Add Product
            </Button>
            <Button variant="outline" onClick={() => navigate('/tenants')}>
              <Building2 className="w-4 h-4 mr-2" />
              Manage Tenants
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <button
                key={stat.label}
                onClick={() => navigate(stat.href)}
                className="stat-card text-left group animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{stat.sub}</p>
              </button>
            ))}
          </div>

          {/* Quota & Training Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Quota */}
            <div className="page-section">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Monthly Image Quota</h3>
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium text-foreground">
                    {quota?.monthlyUsage?.toLocaleString() || 0} / {quota?.monthlyLimit?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${Math.min(monthlyPercentage, 100)}%`,
                      background: monthlyPercentage >= 90 ? 'hsl(var(--destructive))' : monthlyPercentage >= 70 ? 'hsl(var(--warning))' : 'var(--gradient-primary)',
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.max(0, (quota?.monthlyLimit || 0) - (quota?.monthlyUsage || 0)).toLocaleString()} remaining this month
                </p>
              </div>
            </div>

            {/* Training Status */}
            <div className="page-section">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Training Status</h3>
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-sm text-muted-foreground">Completed</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{trainedCount} SKUs</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    <span className="text-sm text-muted-foreground">In Progress</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{trainingCount} SKUs</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    <span className="text-sm text-muted-foreground">Pending</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{pendingCount} SKUs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Overview */}
          {tenants.length > 0 && (
            <div className="page-section">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Tenant Overview</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/tenants')} className="text-xs text-primary">
                  View all
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {tenants.slice(0, 5).map((t, i) => (
                  <div 
                    key={t.id} 
                    className={cn(
                      "flex items-center justify-between py-2.5 border-b border-border last:border-0 animate-fade-in",
                    )}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.skuCount} SKUs · {stores.filter(s => s.tenant_id === t.id).length} stores</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium",
                        t.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {t.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}
