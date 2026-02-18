import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ShelfWithDetails {
  id: string;
  name: string;
  store_id: string | null;
  tenant_id: string;
  description: string | null;
  location_in_store: string | null;
  width_cm: number | null;
  created_at: string;
  updated_at: string;
  store?: any;
  products?: any[];
  imageCount: number;
  lastImage?: any;
}

export function useShelves() {
  const { tenantId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const shelvesQuery = useQuery({
    queryKey: ['shelves'],
    queryFn: async () => {
      const { data: shelves } = await rest.list('shelves', {
        select: '*,store:stores(*),products:shelf_products(*,sku:skus(*))',
        order: 'name.asc',
      });

      const shelvesWithDetails: ShelfWithDetails[] = await Promise.all(
        (shelves || []).map(async (shelf: any) => {
          const { data: images } = await rest.list('shelf_images', {
            select: '*',
            filters: { shelf_id: `eq.${shelf.id}` },
            order: 'created_at.desc',
            limit: 1,
          });

          return {
            ...shelf,
            imageCount: images?.length ?? 0,
            lastImage: images?.[0] ?? null,
          };
        })
      );

      return shelvesWithDetails;
    },
    enabled: !!user,
  });

  const createShelf = useMutation({
    mutationFn: async (shelf: any) => {
      const tid = shelf.tenant_id || tenantId;
      if (!tid) throw new Error('No tenant ID');
      return await rest.create('shelves', { ...shelf, tenant_id: tid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      toast({ title: 'Shelf created', description: 'Your shelf has been added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create shelf', description: error.message, variant: 'destructive' });
    },
  });

  const updateShelf = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      return await rest.update('shelves', { id: `eq.${id}` }, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      toast({ title: 'Shelf updated', description: 'Changes saved successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update shelf', description: error.message, variant: 'destructive' });
    },
  });

  const deleteShelf = useMutation({
    mutationFn: async (id: string) => {
      await rest.remove('shelves', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      toast({ title: 'Shelf deleted', description: 'The shelf has been removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete shelf', description: error.message, variant: 'destructive' });
    },
  });

  const assignProducts = useMutation({
    mutationFn: async ({ shelfId, skuIds, quantities }: { shelfId: string; skuIds: string[]; quantities?: Record<string, number> }) => {
      // Delete existing assignments
      const { data: existing } = await rest.list('shelf_products', {
        select: 'id',
        filters: { shelf_id: `eq.${shelfId}` },
      });
      for (const item of (existing || [])) {
        await rest.remove('shelf_products', item.id);
      }

      // Insert new
      if (skuIds.length > 0) {
        for (let i = 0; i < skuIds.length; i++) {
          await rest.create('shelf_products', {
            shelf_id: shelfId,
            sku_id: skuIds[i],
            position_order: i,
            expected_facings: quantities?.[skuIds[i]] || 1,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      toast({ title: 'Products assigned', description: 'Shelf products updated successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to assign products', description: error.message, variant: 'destructive' });
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
      const { data } = await rest.list('shelf_images', {
        select: '*',
        filters: { shelf_id: `eq.${shelfId}` },
        order: 'created_at.desc',
      });
      return data || [];
    },
    enabled: !!shelfId,
  });

  const addImage = useMutation({
    mutationFn: async ({ shelfId, imageUrl }: { shelfId: string; imageUrl: string }) => {
      return await rest.create('shelf_images', { shelf_id: shelfId, image_url: imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelf-images'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to save image', description: error.message, variant: 'destructive' });
    },
  });

  const deleteImage = useMutation({
    mutationFn: async (imageId: string) => {
      await rest.remove('shelf_images', imageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelf-images'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      toast({ title: 'Image deleted', description: 'The image has been removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete image', description: error.message, variant: 'destructive' });
    },
  });

  return {
    images: imagesQuery.data ?? [],
    isLoading: imagesQuery.isLoading,
    addImage,
    deleteImage,
  };
}
