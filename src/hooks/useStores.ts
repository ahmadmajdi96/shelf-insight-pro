import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Store = Tables<'stores'>;
type StoreInsert = TablesInsert<'stores'>;

interface StoreWithStats extends Store {
  detectionCount: number;
  avgShareOfShelf: number;
  lastDetection: string | null;
}

export function useStores() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const storesQuery = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const storesWithStats: StoreWithStats[] = await Promise.all(
        stores.map(async (store) => {
          const { data: detections, count } = await supabase
            .from('detections')
            .select('share_of_shelf_percentage, processed_at', { count: 'exact' })
            .eq('store_id', store.id)
            .order('processed_at', { ascending: false })
            .limit(100);

          const avgShareOfShelf = detections && detections.length > 0
            ? detections.reduce((sum, d) => sum + (d.share_of_shelf_percentage || 0), 0) / detections.length
            : 0;

          const lastDetection = detections && detections.length > 0
            ? detections[0].processed_at
            : null;

          return {
            ...store,
            detectionCount: count ?? 0,
            avgShareOfShelf: Math.round(avgShareOfShelf * 10) / 10,
            lastDetection,
          };
        })
      );

      return storesWithStats;
    },
    enabled: isAdmin,
  });

  const createStore = useMutation({
    mutationFn: async (store: StoreInsert) => {
      const { data, error } = await supabase
        .from('stores')
        .insert(store)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({ title: 'Store created', description: 'Your store has been added successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create store', description: error.message, variant: 'destructive' });
    },
  });

  const updateStore = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Store> & { id: string }) => {
      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({ title: 'Store updated', description: 'Changes saved successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update store', description: error.message, variant: 'destructive' });
    },
  });

  const deleteStore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stores').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({ title: 'Store deleted', description: 'The store has been removed.' });
    },
    onError: (error) => {
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
