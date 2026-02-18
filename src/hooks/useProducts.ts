import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SKUWithImages {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  barcode: string | null;
  training_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sku_images: any[];
  product_categories: { name: string } | null;
}

export function useProducts() {
  const { tenantId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await rest.list('skus', {
        select: '*,sku_images(*),product_categories(name)',
        order: 'created_at.desc',
      });
      return (data || []) as SKUWithImages[];
    },
    enabled: !!user,
  });

  const createProduct = useMutation({
    mutationFn: async (product: any) => {
      const tid = product.tenant_id || tenantId;
      if (!tid) throw new Error('No tenant ID');

      const { images, ...productData } = product;
      const sku = await rest.create('skus', { ...productData, tenant_id: tid });

      if (images && images.length > 0 && sku?.id) {
        const { storage } = await import('@/lib/api-client');
        for (const image of images) {
          const fileName = `${tid}/${sku.id}/${Date.now()}-${image.name}`;
          try {
            await storage.upload('sku-training-images', fileName, image);
            const publicUrl = storage.getPublicUrl('sku-training-images', fileName);
            await rest.create('sku_images', { sku_id: sku.id, image_url: publicUrl });
          } catch (err) {
            console.error('Image upload failed:', err);
          }
        }
      }

      return sku;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product created', description: 'Your product has been added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create product', description: error.message, variant: 'destructive' });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      return await rest.update('skus', { id: `eq.${id}` }, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product updated', description: 'Changes saved successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update product', description: error.message, variant: 'destructive' });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await rest.remove('skus', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product deleted', description: 'The product has been removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete product', description: error.message, variant: 'destructive' });
    },
  });

  const uploadProductImage = useMutation({
    mutationFn: async ({ skuId, file }: { skuId: string; file: File }) => {
      const tid = tenantId;
      if (!tid) throw new Error('No tenant ID');

      const { storage } = await import('@/lib/api-client');
      const fileName = `${tid}/${skuId}/${Date.now()}-${file.name}`;
      await storage.upload('sku-training-images', fileName, file);
      const publicUrl = storage.getPublicUrl('sku-training-images', fileName);
      return await rest.create('sku_images', { sku_id: skuId, image_url: publicUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Image uploaded', description: 'Training image added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to upload image', description: error.message, variant: 'destructive' });
    },
  });

  return {
    products: productsQuery.data ?? [],
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
  };
}
