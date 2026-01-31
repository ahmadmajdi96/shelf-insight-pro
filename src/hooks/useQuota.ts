import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface QuotaInfo {
  canProcess: boolean;
  canAddSku: boolean;
  skuCount: number;
  skuLimit: number;
  monthlyUsage: number;
  monthlyLimit: number;
  weeklyUsage: number;
  weeklyLimit: number;
  yearlyUsage: number;
  yearlyLimit: number;
  status: string;
}

export function useQuota() {
  const { tenantId } = useAuth();

  const quotaQuery = useQuery({
    queryKey: ['quota', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .rpc('check_tenant_quota', { _tenant_id: tenantId });

      if (error) throw error;
      return data as unknown as QuotaInfo;
    },
    enabled: !!tenantId,
    refetchInterval: 60000, // Refresh every minute
  });

  const monthlyPercentage = quotaQuery.data 
    ? (quotaQuery.data.monthlyUsage / quotaQuery.data.monthlyLimit) * 100
    : 0;

  const skuPercentage = quotaQuery.data
    ? (quotaQuery.data.skuCount / quotaQuery.data.skuLimit) * 100
    : 0;

  return {
    quota: quotaQuery.data,
    isLoading: quotaQuery.isLoading,
    error: quotaQuery.error,
    monthlyPercentage,
    skuPercentage,
    canProcess: quotaQuery.data?.canProcess ?? false,
    canAddSku: quotaQuery.data?.canAddSku ?? false,
    isNearLimit: monthlyPercentage >= 80,
    isAtLimit: monthlyPercentage >= 100,
  };
}
