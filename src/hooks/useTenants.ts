import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Tenant = Tables<'tenants'>;
type TenantInsert = TablesInsert<'tenants'>;

interface TenantWithStats extends Tenant {
  skuCount: number;
  userCount: number;
}

export function useTenants() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tenantsQuery = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const tenantsWithStats: TenantWithStats[] = await Promise.all(
        tenants.map(async (tenant) => {
          const { count: skuCount } = await supabase
            .from('skus')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id);

          const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id);

          return {
            ...tenant,
            skuCount: skuCount ?? 0,
            userCount: userCount ?? 0,
          };
        })
      );

      return tenantsWithStats;
    },
    enabled: isAdmin,
  });

  const createTenant = useMutation({
    mutationFn: async (tenant: Omit<TenantInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('tenants')
        .insert(tenant)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: 'Tenant created', description: 'The new tenant has been added successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create tenant', description: error.message, variant: 'destructive' });
    },
  });

  const updateTenant = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tenant> & { id: string }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: 'Tenant updated', description: 'Changes saved successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update tenant', description: error.message, variant: 'destructive' });
    },
  });

  const suspendTenant = useMutation({
    mutationFn: async ({ id, suspend }: { id: string; suspend: boolean }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update({ 
          status: suspend ? 'suspended' : 'active',
          is_active: !suspend 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { suspend }) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({
        title: suspend ? 'Tenant suspended' : 'Tenant activated',
        description: suspend 
          ? 'The tenant has been suspended.'
          : 'The tenant has been activated.',
      });
    },
    onError: (error) => {
      toast({ title: 'Failed to update tenant status', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTenant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tenants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: 'Tenant deleted', description: 'The tenant has been removed.' });
    },
    onError: (error) => {
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
