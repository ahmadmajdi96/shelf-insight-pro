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
      // Fetch stores and detections in parallel (no N+1)
      const [storesRes, detectionsRes] = await Promise.all([
        rest.list('stores', { select: '*', order: 'name.asc' }),
        rest.list('detections', { select: 'id,store_id,share_of_shelf_percentage,processed_at', order: 'processed_at.desc' }),
      ]);

      const stores = storesRes.data || [];
      const detections = detectionsRes.data || [];

      // Group detections by store_id
      const detectionsByStore = new Map<string, any[]>();
      detections.forEach((d: any) => {
        if (d.store_id) {
          if (!detectionsByStore.has(d.store_id)) detectionsByStore.set(d.store_id, []);
          detectionsByStore.get(d.store_id)!.push(d);
        }
      });

      return stores.map((store: any): StoreWithStats => {
        const storeDetections = detectionsByStore.get(store.id) || [];
        const avgShareOfShelf = storeDetections.length > 0
          ? storeDetections.reduce((sum: number, d: any) => sum + (d.share_of_shelf_percentage || 0), 0) / storeDetections.length
          : 0;

        return {
          ...store,
          detectionCount: storeDetections.length,
          avgShareOfShelf: Math.round(avgShareOfShelf * 10) / 10,
          lastDetection: storeDetections[0]?.processed_at || null,
        };
      });
    },
    enabled: !!user,
  });

  const createStore = useMutation({
    mutationFn: async (store: any) => rest.create('stores', store),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({ title: 'Store created', description: 'Your store has been added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create store', description: error.message, variant: 'destructive' });
    },
  });

  const updateStore = useMutation({
    mutationFn: async ({ id, ...updates }: any) => rest.update('stores', { id: `eq.${id}` }, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({ title: 'Store updated', description: 'Changes saved successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update store', description: error.message, variant: 'destructive' });
    },
  });

  const deleteStore = useMutation({
    mutationFn: async (id: string) => { await rest.remove('stores', id); },
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
