import { Store, ImageIcon, CheckCircle2, Loader2, Building2, ArrowUpRight, Shield } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStores } from '@/hooks/useStores';
import { useQuota } from '@/hooks/useQuota';
import { useTenants } from '@/hooks/useTenants';
import { useAdmins } from '@/hooks/useAdmins';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, isOwner, isAdmin, isTenantAdmin, adminId, tenantId, role } = useAuth();
  const { stores, isLoading: storesLoading } = useStores();
  const { quota, monthlyPercentage, isLoading: quotaLoading } = useQuota();
  const { tenants } = useTenants();
  const { admins, isLoading: adminsLoading } = useAdmins();

  const isLoading = storesLoading || quotaLoading || adminsLoading;

  const isTenantOnly = role === 'tenant_admin' || role === 'tenant_user';

  // For admin role users, filter data to their admin_id
  const filteredTenants = useMemo(() => {
    if (isOwner) return tenants;
    if (isTenantOnly && tenantId) return tenants.filter(t => t.id === tenantId);
    if (adminId) return tenants.filter((t: any) => t.admin_id === adminId);
    return tenants;
  }, [tenants, isOwner, adminId, isTenantOnly, tenantId]);

  const filteredStores = useMemo(() => {
    if (isOwner) return stores;
    const tenantIds = new Set(filteredTenants.map(t => t.id));
    return stores.filter(s => tenantIds.has(s.tenant_id));
  }, [stores, isOwner, filteredTenants]);

  const activeTenants = filteredTenants.filter(t => t.is_active).length;
  const activeAdmins = admins.filter(a => a.is_active).length;

  const stats = isOwner
    ? [
        { label: 'Admins', value: admins.length, sub: `${activeAdmins} active`, icon: Shield, href: '/management?tab=admins' },
        { label: 'Tenants', value: filteredTenants.length, sub: `${activeTenants} active`, icon: Building2, href: '/management?tab=tenants' },
        { label: 'Stores', value: filteredStores.length, sub: 'Monitored', icon: Store, href: '/management?tab=stores' },
      ]
    : isTenantOnly
    ? [
        { label: 'Stores', value: filteredStores.length, sub: 'Monitored', icon: Store, href: '/management?tab=stores' },
      ]
    : [
        { label: 'Tenants', value: filteredTenants.length, sub: `${activeTenants} active`, icon: Building2, href: '/management?tab=tenants' },
        { label: 'Stores', value: filteredStores.length, sub: 'Monitored', icon: Store, href: '/management?tab=stores' },
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
          {/* Stats Grid */}
          <div className={cn("grid gap-4", isOwner ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
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

          {/* Quota & Admin/Tenant Summary Row */}
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

            {/* Admin Summary - only for owner */}
            {isOwner ? (
              <div className="page-section">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Admin Summary</h3>
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-sm text-muted-foreground">Active Admins</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{activeAdmins}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      <span className="text-sm text-muted-foreground">Inactive Admins</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{admins.length - activeAdmins}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm text-muted-foreground">Total Monthly Limit</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{admins.reduce((a, ad) => a + ad.monthly_limit, 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : !isTenantOnly ? (
              <div className="page-section">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Tenant Summary</h3>
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-sm text-muted-foreground">Active Tenants</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{activeTenants}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      <span className="text-sm text-muted-foreground">Suspended Tenants</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{filteredTenants.length - activeTenants}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm text-muted-foreground">Total Stores</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{filteredStores.length}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="page-section">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Store Summary</h3>
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-sm text-muted-foreground">Total Stores</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{filteredStores.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm text-muted-foreground">Tenant</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{filteredTenants[0]?.name || '—'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admins Overview - owner only */}
          {isOwner && admins.length > 0 && (
            <div className="page-section">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Admins Overview</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/management?tab=admins')} className="text-xs text-primary">
                  View all
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {admins.slice(0, 5).map((admin, i) => {
                  const adminTenants = tenants.filter((t: any) => t.admin_id === admin.id);
                  const allocatedImages = adminTenants.reduce((a, t) => a + t.max_images_per_month, 0);
                  return (
                    <div 
                      key={admin.id} 
                      className="flex items-center justify-between py-2.5 border-b border-border last:border-0 animate-fade-in"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{admin.full_name}</p>
                          <p className="text-xs text-muted-foreground">{adminTenants.length} tenants · {allocatedImages.toLocaleString()} / {admin.monthly_limit.toLocaleString()} images</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={admin.is_active ? 'default' : 'secondary'} className="text-[10px]">
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tenant Overview */}
          {filteredTenants.length > 0 && (
            <div className="page-section">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Tenant Overview</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/management?tab=tenants')} className="text-xs text-primary">
                  View all
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {filteredTenants.slice(0, 5).map((t, i) => (
                  <div 
                    key={t.id} 
                    className="flex items-center justify-between py-2.5 border-b border-border last:border-0 animate-fade-in"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.skuCount} SKUs · {filteredStores.filter(s => s.tenant_id === t.id).length} stores</p>
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
