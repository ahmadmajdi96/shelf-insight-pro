import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TenantWithStats {
  id: string;
  name: string;
  logo_url: string | null;
  max_skus: number;
  max_images_per_month: number;
  max_images_per_week: number;
  max_images_per_year: number;
  processed_images_this_month: number;
  processed_images_this_week: number;
  processed_images_this_year: number;
  is_active: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  username: string | null;
  password: string | null;
  skuCount: number;
  userCount: number;
}

export function useTenants() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tenantsQuery = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data: tenants } = await rest.list('tenants', {
        select: '*',
        order: 'name.asc',
      });

      const tenantsWithStats: TenantWithStats[] = await Promise.all(
        (tenants || []).map(async (tenant: any) => {
          const { data: skus } = await rest.list('skus', {
            select: '*',
            filters: { tenant_id: `eq.${tenant.id}` },
          });

          const { data: profiles } = await rest.list('profiles', {
            select: '*',
            filters: { tenant_id: `eq.${tenant.id}` },
          });

          return {
            ...tenant,
            skuCount: skus?.length ?? 0,
            userCount: profiles?.length ?? 0,
          };
        })
      );

      return tenantsWithStats;
    },
    enabled: !!user,
  });

  const createTenant = useMutation({
    mutationFn: async (tenant: any) => {
      return await rest.create('tenants', tenant);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: 'Tenant created', description: 'The new tenant has been added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create tenant', description: error.message, variant: 'destructive' });
    },
  });

  const updateTenant = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      return await rest.update('tenants', { id: `eq.${id}` }, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: 'Tenant updated', description: 'Changes saved successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update tenant', description: error.message, variant: 'destructive' });
    },
  });

  const suspendTenant = useMutation({
    mutationFn: async ({ id, suspend }: { id: string; suspend: boolean }) => {
      return await rest.update('tenants', { id: `eq.${id}` }, {
        status: suspend ? 'suspended' : 'active',
        is_active: !suspend,
      });
    },
    onSuccess: (_, { suspend }) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({
        title: suspend ? 'Tenant suspended' : 'Tenant activated',
        description: suspend ? 'The tenant has been suspended.' : 'The tenant has been activated.',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update tenant status', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTenant = useMutation({
    mutationFn: async (id: string) => {
      await rest.remove('tenants', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: 'Tenant deleted', description: 'The tenant has been removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete tenant', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tenants: tenantsQuery.data ?? [],
    isLoading: tenantsQuery.isLoading,
    error: tenantsQuery.error,
    createTenant,
    updateTenant,
    suspendTenant,
    deleteTenant,
  };
}
