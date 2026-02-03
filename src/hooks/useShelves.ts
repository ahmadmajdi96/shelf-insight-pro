import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Shelf = Tables<'shelves'>;
type ShelfInsert = TablesInsert<'shelves'>;
type ShelfProduct = Tables<'shelf_products'>;
type ShelfImage = Tables<'shelf_images'>;

interface ShelfWithDetails extends Shelf {
  store?: Tables<'stores'> | null;
  products?: Array<ShelfProduct & { sku?: Tables<'skus'> | null }>;
  imageCount: number;
  lastImage?: ShelfImage | null;
}

export function useShelves() {
  const { tenantId, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const shelvesQuery = useQuery({
    queryKey: ['shelves', tenantId, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('shelves')
        .select(`
          *,
          store:stores(*),
          products:shelf_products(*, sku:skus(*))
        `)
        .order('name', { ascending: true });

      if (!isAdmin && tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data: shelves, error } = await query;
      if (error) throw error;

      // Get image counts for each shelf
      const shelvesWithDetails: ShelfWithDetails[] = await Promise.all(
        (shelves || []).map(async (shelf) => {
          const { count, data: images } = await supabase
            .from('shelf_images')
            .select('*', { count: 'exact' })
            .eq('shelf_id', shelf.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...shelf,
            imageCount: count ?? 0,
            lastImage: images?.[0] ?? null,
          };
        })
      );

      return shelvesWithDetails;
    },
    enabled: !!tenantId || isAdmin,
  });

  const createShelf = useMutation({
    mutationFn: async (shelf: Omit<ShelfInsert, 'tenant_id'>) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('shelves')
        .insert({ ...shelf, tenant_id: tenantId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      toast({
        title: 'Shelf created',
        description: 'Your shelf has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create shelf',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateShelf = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Shelf> & { id: string }) => {
      const { data, error } = await supabase
        .from('shelves')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      toast({
        title: 'Shelf updated',
        description: 'Changes saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update shelf',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteShelf = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shelves').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      toast({
        title: 'Shelf deleted',
        description: 'The shelf has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete shelf',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const assignProducts = useMutation({
    mutationFn: async ({ 
      shelfId, 
      skuIds, 
      quantities 
    }: { 
      shelfId: string; 
      skuIds: string[]; 
      quantities?: Record<string, number>;
    }) => {
      // First, remove existing assignments
      await supabase.from('shelf_products').delete().eq('shelf_id', shelfId);

      // Then add new assignments
      if (skuIds.length > 0) {
        const { error } = await supabase.from('shelf_products').insert(
          skuIds.map((skuId, index) => ({
            shelf_id: shelfId,
            sku_id: skuId,
            position_order: index,
            expected_facings: quantities?.[skuId] || 1,
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      toast({
        title: 'Products assigned',
        description: 'Shelf products updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to assign products',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    shelves: shelvesQuery.data ?? [],
    isLoading: shelvesQuery.isLoading,
    error: shelvesQuery.error,
    createShelf,
    updateShelf,
    deleteShelf,
    assignProducts,
  };
}

export function useShelfImages(shelfId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const imagesQuery = useQuery({
    queryKey: ['shelf-images', shelfId],
    queryFn: async () => {
      if (!shelfId) return [];

      const { data, error } = await supabase
        .from('shelf_images')
        .select('*')
        .eq('shelf_id', shelfId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!shelfId,
  });

  const addImage = useMutation({
    mutationFn: async ({ shelfId, imageUrl }: { shelfId: string; imageUrl: string }) => {
      const { data, error } = await supabase
        .from('shelf_images')
        .insert({
          shelf_id: shelfId,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelf-images'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to save image',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteImage = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase.from('shelf_images').delete().eq('id', imageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelf-images'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      toast({
        title: 'Image deleted',
        description: 'The image has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete image',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    images: imagesQuery.data ?? [],
    isLoading: imagesQuery.isLoading,
    addImage,
    deleteImage,
  };
}