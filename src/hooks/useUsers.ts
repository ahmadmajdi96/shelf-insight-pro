import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rest, auth as apiAuth } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export interface UserWithProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  tenantId: string | null;
  role: string;
  lastLogin: string | null;
  createdAt: string;
}

export interface UserStoreAccess {
  id: string;
  userId: string;
  storeId: string;
  storeName: string;
}

export interface UserShelfAccess {
  id: string;
  userId: string;
  shelfId: string;
  shelfName: string;
}

export function useUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: profiles } = await rest.list('profiles', {
        select: '*',
        order: 'created_at.desc',
      });

      const { data: roles } = await rest.list('user_roles', { select: '*' });

      const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));

      return (profiles || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        email: '',
        fullName: p.full_name,
        username: p.username,
        avatarUrl: p.avatar_url,
        tenantId: p.tenant_id,
        role: roleMap.get(p.user_id) || 'tenant_user',
        lastLogin: p.last_login,
        createdAt: p.created_at,
      })) as UserWithProfile[];
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data: existing } = await rest.list('user_roles', {
        select: 'id',
        filters: { user_id: `eq.${userId}` },
      });

      if (existing && existing.length > 0) {
        await rest.update('user_roles', { user_id: `eq.${userId}` }, { role });
      } else {
        await rest.create('user_roles', { user_id: userId, role });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Role updated successfully' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update role', description: err.message, variant: 'destructive' });
    },
  });

  const createUser = useMutation({
    mutationFn: async ({ email, password, fullName, username, role, tenantId }: {
      email: string; password: string; fullName: string; username?: string; role: string; tenantId?: string;
    }) => {
      const data = await apiAuth.signup(email, password, { full_name: fullName });
      if (!data?.user?.id && !data?.id) throw new Error('User creation failed');
      
      const userId = data?.user?.id || data?.id;

      await rest.update('profiles', { user_id: `eq.${userId}` }, {
        full_name: fullName,
        username: username || null,
        tenant_id: tenantId || null,
      });

      await rest.create('user_roles', { user_id: userId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User created successfully' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create user', description: err.message, variant: 'destructive' });
    },
  });

  const updateUserProfile = useMutation({
    mutationFn: async ({ userId, fullName, username, tenantId }: {
      userId: string; fullName: string; username?: string; tenantId?: string;
    }) => {
      await rest.update('profiles', { user_id: `eq.${userId}` }, {
        full_name: fullName,
        username: username || null,
        tenant_id: tenantId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User updated successfully' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update user', description: err.message, variant: 'destructive' });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Get profile id first
      const { data: profiles } = await rest.list('profiles', {
        select: 'id',
        filters: { user_id: `eq.${userId}` },
      });
      if (profiles?.[0]) {
        await rest.remove('profiles', profiles[0].id);
      }
      // Remove roles
      const { data: roles } = await rest.list('user_roles', {
        select: 'id',
        filters: { user_id: `eq.${userId}` },
      });
      if (roles?.[0]) {
        await rest.remove('user_roles', roles[0].id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User removed successfully' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to remove user', description: err.message, variant: 'destructive' });
    },
  });

  // Store access
  const useUserStoreAccess = (userId: string) => useQuery({
    queryKey: ['user-store-access', userId],
    queryFn: async () => {
      const { data } = await rest.list('user_store_access', {
        select: '*,stores(name)',
        filters: { user_id: `eq.${userId}` },
      });
      return (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        storeId: d.store_id,
        storeName: d.stores?.name || 'Unknown',
      })) as UserStoreAccess[];
    },
    enabled: !!userId,
  });

  const assignStore = useMutation({
    mutationFn: async ({ userId, storeId }: { userId: string; storeId: string }) => {
      await rest.create('user_store_access', { user_id: userId, store_id: storeId });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['user-store-access', vars.userId] });
      toast({ title: 'Store access granted' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to assign store', description: err.message, variant: 'destructive' });
    },
  });

  const revokeStore = useMutation({
    mutationFn: async ({ id }: { id: string; userId: string }) => {
      await rest.remove('user_store_access', id);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['user-store-access', vars.userId] });
      toast({ title: 'Store access revoked' });
    },
  });

  const useUserShelfAccess = (userId: string) => useQuery({
    queryKey: ['user-shelf-access', userId],
    queryFn: async () => {
      const { data } = await rest.list('user_shelf_access', {
        select: '*,shelves(name)',
        filters: { user_id: `eq.${userId}` },
      });
      return (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        shelfId: d.shelf_id,
        shelfName: d.shelves?.name || 'Unknown',
      })) as UserShelfAccess[];
    },
    enabled: !!userId,
  });

  const assignShelf = useMutation({
    mutationFn: async ({ userId, shelfId }: { userId: string; shelfId: string }) => {
      await rest.create('user_shelf_access', { user_id: userId, shelf_id: shelfId });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['user-shelf-access', vars.userId] });
      toast({ title: 'Shelf access granted' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to assign shelf', description: err.message, variant: 'destructive' });
    },
  });

  const revokeShelf = useMutation({
    mutationFn: async ({ id }: { id: string; userId: string }) => {
      await rest.remove('user_shelf_access', id);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['user-shelf-access', vars.userId] });
      toast({ title: 'Shelf access revoked' });
    },
  });

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    createUser,
    updateUserProfile,
    updateUserRole,
    deleteUser,
    useUserStoreAccess,
    useUserShelfAccess,
    assignStore,
    revokeStore,
    assignShelf,
    revokeShelf,
  };
}
