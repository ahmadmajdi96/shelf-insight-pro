import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles.map(r => [r.user_id, r.role]));

      return profiles.map(p => ({
        id: p.id,
        userId: p.user_id,
        email: '', // Will be populated client-side if needed
        fullName: p.full_name,
        username: (p as any).username,
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
      // Check if role exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: role as any })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: role as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Role updated successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update role', description: err.message, variant: 'destructive' });
    },
  });

  const createUser = useMutation({
    mutationFn: async ({ email, password, fullName, username, role, tenantId }: {
      email: string; password: string; fullName: string; username?: string; role: string; tenantId?: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('User creation failed');

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, username: username || null, tenant_id: tenantId || null })
        .eq('user_id', data.user.id);
      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role: role as any });
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User created successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create user', description: err.message, variant: 'destructive' });
    },
  });

  const updateUserProfile = useMutation({
    mutationFn: async ({ userId, fullName, username, tenantId }: {
      userId: string; fullName: string; username?: string; tenantId?: string;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, username: username || null, tenant_id: tenantId || null })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User updated successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update user', description: err.message, variant: 'destructive' });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
      await supabase.from('user_roles').delete().eq('user_id', userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User removed successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to remove user', description: err.message, variant: 'destructive' });
    },
  });

  // Store access
  const useUserStoreAccess = (userId: string) => useQuery({
    queryKey: ['user-store-access', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_store_access' as any)
        .select('*, stores(name)')
        .eq('user_id', userId);
      if (error) throw error;
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
      const { error } = await supabase
        .from('user_store_access' as any)
        .insert({ user_id: userId, store_id: storeId } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['user-store-access', vars.userId] });
      toast({ title: 'Store access granted' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to assign store', description: err.message, variant: 'destructive' });
    },
  });

  const revokeStore = useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('user_store_access' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['user-store-access', vars.userId] });
      toast({ title: 'Store access revoked' });
    },
  });

  // Shelf access
  const useUserShelfAccess = (userId: string) => useQuery({
    queryKey: ['user-shelf-access', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_shelf_access' as any)
        .select('*, shelves(name)')
        .eq('user_id', userId);
      if (error) throw error;
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
      const { error } = await supabase
        .from('user_shelf_access' as any)
        .insert({ user_id: userId, shelf_id: shelfId } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['user-shelf-access', vars.userId] });
      toast({ title: 'Shelf access granted' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to assign shelf', description: err.message, variant: 'destructive' });
    },
  });

  const revokeShelf = useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('user_shelf_access' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
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
