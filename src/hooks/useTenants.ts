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
  admin_id: string | null;
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
      // Fetch tenants, skus counts, and profile counts in parallel (no N+1)
      const [tenantsRes, skusRes, profilesRes] = await Promise.all([
        rest.list('tenants', { select: '*', order: 'name.asc' }),
        rest.list('skus', { select: 'id,tenant_id' }),
        rest.list('profiles', { select: 'id,tenant_id' }),
      ]);

      const tenants = tenantsRes.data || [];
      const skus = skusRes.data || [];
      const profiles = profilesRes.data || [];

      // Count by tenant_id client-side
      const skuCounts = new Map<string, number>();
      skus.forEach((s: any) => skuCounts.set(s.tenant_id, (skuCounts.get(s.tenant_id) || 0) + 1));

      const userCounts = new Map<string, number>();
      profiles.forEach((p: any) => {
        if (p.tenant_id) userCounts.set(p.tenant_id, (userCounts.get(p.tenant_id) || 0) + 1);
      });

      return tenants.map((tenant: any): TenantWithStats => ({
        ...tenant,
        skuCount: skuCounts.get(tenant.id) || 0,
        userCount: userCounts.get(tenant.id) || 0,
      }));
    },
    enabled: !!user,
  });

  const createTenant = useMutation({
    mutationFn: async (tenant: any) => {
      // Only send fields the backend expects; always include status + is_active
      const payload: Record<string, any> = {
        name: tenant.name,
        status: 'active',
        is_active: true,
      };
      if (tenant.username) payload.username = tenant.username;
      if (tenant.password) payload.password = tenant.password;
      if (tenant.max_skus != null) payload.max_skus = tenant.max_skus;
      if (tenant.max_images_per_month != null) payload.max_images_per_month = tenant.max_images_per_month;
      if (tenant.admin_id) payload.admin_id = tenant.admin_id;
      return rest.create('tenants', payload);
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
    mutationFn: async ({ id, ...updates }: any) => rest.update('tenants', { id: `eq.${id}` }, updates),
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
      return rest.update('tenants', { id: `eq.${id}` }, {
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
    mutationFn: async (id: string) => { await rest.remove('tenants', id); },
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
