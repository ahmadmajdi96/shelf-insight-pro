import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  userId: string;
  tenantId: string | null;
  type: 'processing_complete' | 'training_complete' | 'quota_warning' | 'system_alert';
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data } = await rest.list('notifications', {
        select: '*',
        filters: { user_id: `eq.${user.id}` },
        order: 'created_at.desc',
        limit: 50,
      });

      return (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        tenantId: n.tenant_id,
        type: n.type as Notification['type'],
        title: n.title,
        message: n.message,
        isRead: n.is_read,
        metadata: n.metadata as Record<string, unknown> | null,
        createdAt: n.created_at,
      })) as Notification[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await rest.update('notifications', { id: `eq.${id}` }, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await rest.update('notifications', { user_id: `eq.${user.id}`, is_read: 'eq.false' }, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await rest.remove('notifications', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const createNotification = useMutation({
    mutationFn: async (data: { userId: string; title: string; message: string; type: string; tenantId?: string }) => {
      await rest.create('notifications', {
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        tenant_id: data.tenantId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notificationsQuery.data?.filter(n => !n.isRead).length ?? 0;

  return {
    notifications: notificationsQuery.data ?? [],
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
  };
}
