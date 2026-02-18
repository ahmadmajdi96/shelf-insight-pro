import { useQuery } from '@tanstack/react-query';
import { rest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface TenantActivity {
  tenant: string;
  tenantId: string;
  images: number;
  skus: number;
  trend: 'up' | 'down';
}

interface RecentActivityItem {
  id: string;
  tenant: string;
  action: string;
  time: string;
  type: 'detection' | 'product' | 'training' | 'store';
}

interface WeeklyDataPoint {
  name: string;
  images: number;
}

export function useActivity() {
  const { user } = useAuth();

  const tenantsQuery = useQuery({
    queryKey: ['activity-tenants'],
    queryFn: async () => {
      const { data: tenants } = await rest.list('tenants', {
        select: '*',
        order: 'processed_images_this_month.desc',
      });

      return (tenants || []).map((t: any) => ({
        tenant: t.name,
        tenantId: t.id,
        images: t.processed_images_this_month || 0,
        skus: 0, // will be enriched below
        trend: (t.processed_images_this_month || 0) >= (t.processed_images_this_week || 0) ? 'up' : 'down',
      }));
    },
    enabled: !!user,
  });

  // Get SKU counts per tenant
  const skuCountsQuery = useQuery({
    queryKey: ['activity-sku-counts'],
    queryFn: async () => {
      const { data: skus } = await rest.list('skus', {
        select: 'id,tenant_id',
      });
      const counts: Record<string, number> = {};
      (skus || []).forEach((s: any) => {
        counts[s.tenant_id] = (counts[s.tenant_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  // Get weekly usage metrics
  const weeklyQuery = useQuery({
    queryKey: ['activity-weekly'],
    queryFn: async () => {
      const { data: metrics } = await rest.list('usage_metrics', {
        select: '*',
        filters: { period_type: 'eq.daily' },
        order: 'period_start.desc',
        limit: 7,
      });
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return (metrics || []).reverse().map((m: any) => ({
        name: dayNames[new Date(m.period_start).getDay()],
        images: m.images_processed || 0,
      })) as WeeklyDataPoint[];
    },
    enabled: !!user,
  });

  // Get recent detections as activity feed
  const recentQuery = useQuery({
    queryKey: ['activity-recent'],
    queryFn: async () => {
      const { data: detections } = await rest.list('detections', {
        select: '*,tenant:tenants(name)',
        order: 'processed_at.desc',
        limit: 10,
      });

      return (detections || []).map((d: any) => ({
        id: d.id,
        tenant: d.tenant?.name || 'Unknown',
        action: `Processed shelf image (${d.detected_skus || 0} SKUs detected)`,
        time: formatRelativeTime(d.processed_at),
        type: 'detection' as 'detection' | 'product' | 'training' | 'store',
      }));
    },
    enabled: !!user,
  });

  // Merge SKU counts into tenant activity
  const activityData: TenantActivity[] = (tenantsQuery.data || []).map((t: any) => ({
    ...t,
    skus: skuCountsQuery.data?.[t.tenantId] || 0,
  }));

  // Compute totals
  const totalImages = activityData.reduce((sum, t) => sum + t.images, 0);
  const totalSkus = Object.values(skuCountsQuery.data || {}).reduce((sum: number, c: any) => sum + c, 0);
  const activeTenants = activityData.filter(t => t.images > 0).length || activityData.length;

  return {
    activityData,
    chartData: weeklyQuery.data || [],
    recentActivity: recentQuery.data || [],
    totalImages,
    totalSkus,
    activeTenants,
    isLoading: tenantsQuery.isLoading,
  };
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
