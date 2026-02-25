import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rest } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export interface Admin {
  id: string;
  email: string;
  phone: string | null;
  password: string;
  full_name: string;
  monthly_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAdmins() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const adminsQuery = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const { data } = await rest.list('admins', {
        select: '*',
        order: 'created_at.desc',
      });
      return (data || []) as Admin[];
    },
  });

  const createAdmin = useMutation({
    mutationFn: async (admin: Omit<Admin, 'id' | 'created_at' | 'updated_at'>) => {
      return await rest.create('admins', admin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast({ title: 'Admin created successfully' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create admin', description: err.message, variant: 'destructive' });
    },
  });

  const updateAdmin = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Admin> & { id: string }) => {
      return await rest.update('admins', { id: `eq.${id}` }, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast({ title: 'Admin updated successfully' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update admin', description: err.message, variant: 'destructive' });
    },
  });

  const deleteAdmin = useMutation({
    mutationFn: async (id: string) => {
      await rest.remove('admins', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast({ title: 'Admin deleted successfully' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to delete admin', description: err.message, variant: 'destructive' });
    },
  });

  // Suspend/activate admin with cascade to tenants, stores, etc.
  const suspendAdmin = useMutation({
    mutationFn: async ({ id, suspend }: { id: string; suspend: boolean }) => {
      // Update admin status
      await rest.update('admins', { id: `eq.${id}` }, { is_active: !suspend });

      // Get all tenants belonging to this admin
      const { data: adminTenants } = await rest.list('tenants', {
        select: 'id',
        filters: { admin_id: `eq.${id}` },
      });

      if (adminTenants && adminTenants.length > 0) {
        // Update all tenants
        for (const tenant of adminTenants) {
          await rest.update('tenants', { id: `eq.${tenant.id}` }, {
            status: suspend ? 'suspended' : 'active',
            is_active: !suspend,
          });

          // Update all stores for this tenant
          // Note: stores don't have is_active/status columns, but we update tenants which controls access

          // Update all SKUs for this tenant
          await rest.update('skus', { tenant_id: `eq.${tenant.id}` }, {
            is_active: !suspend,
          });
        }
      }
    },
    onSuccess: (_, { suspend }) => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: suspend ? 'Admin suspended' : 'Admin activated',
        description: suspend
          ? 'Admin and all associated tenants, stores, and products have been suspended.'
          : 'Admin and all associated tenants, stores, and products have been activated.',
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update admin status', description: err.message, variant: 'destructive' });
    },
  });

  return {
    admins: adminsQuery.data ?? [],
    isLoading: adminsQuery.isLoading,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    suspendAdmin,
  };
}
