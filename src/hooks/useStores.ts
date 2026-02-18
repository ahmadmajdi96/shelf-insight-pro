import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface StoreWithStats {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
  detectionCount: number;
  avgShareOfShelf: number;
  lastDetection: string | null;
}

export function useStores() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const storesQuery = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data: stores } = await rest.list('stores', {
        select: '*',
        order: 'name.asc',
      });

      const storesWithStats: StoreWithStats[] = await Promise.all(
        (stores || []).map(async (store: any) => {
          const { data: detections } = await rest.list('detections', {
            select: 'share_of_shelf_percentage,processed_at',
            filters: { store_id: `eq.${store.id}` },
            order: 'processed_at.desc',
            limit: 100,
          });

          const avgShareOfShelf = detections && detections.length > 0
            ? detections.reduce((sum: number, d: any) => sum + (d.share_of_shelf_percentage || 0), 0) / detections.length
            : 0;

          const lastDetection = detections && detections.length > 0
            ? detections[0].processed_at
            : null;

          return {
            ...store,
            detectionCount: detections?.length ?? 0,
            avgShareOfShelf: Math.round(avgShareOfShelf * 10) / 10,
            lastDetection,
          };
        })
      );

      return storesWithStats;
    },
    enabled: !!user,
  });

  const createStore = useMutation({
    mutationFn: async (store: any) => {
      return await rest.create('stores', store);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({ title: 'Store created', description: 'Your store has been added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create store', description: error.message, variant: 'destructive' });
    },
  });

  const updateStore = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      return await rest.update('stores', { id: `eq.${id}` }, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({ title: 'Store updated', description: 'Changes saved successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update store', description: error.message, variant: 'destructive' });
    },
  });

  const deleteStore = useMutation({
    mutationFn: async (id: string) => {
      await rest.remove('stores', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({ title: 'Store deleted', description: 'The store has been removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete store', description: error.message, variant: 'destructive' });
    },
  });

  return {
    stores: storesQuery.data ?? [],
    isLoading: storesQuery.isLoading,
    error: storesQuery.error,
    createStore,
    updateStore,
    deleteStore,
  };
}
