import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type SKU = Tables<'skus'>;
type SKUInsert = TablesInsert<'skus'>;
type SKUImage = Tables<'sku_images'>;

interface SKUWithImages extends SKU {
  sku_images: SKUImage[];
  product_categories: { name: string } | null;
}

export function useProducts() {
  const { tenantId, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products', tenantId, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('skus')
        .select(`
          *,
          sku_images (*),
          product_categories (name)
        `)
        .order('created_at', { ascending: false });

      // Tenant users only see their products, admins see all
      if (!isAdmin && tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as SKUWithImages[];
    },
    enabled: !!tenantId || isAdmin,
  });

  const createProduct = useMutation({
    mutationFn: async (product: Omit<SKUInsert, 'tenant_id'> & { images?: File[] }) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { images, ...productData } = product;

      // Insert the SKU
      const { data: sku, error: skuError } = await supabase
        .from('skus')
        .insert({ ...productData, tenant_id: tenantId })
        .select()
        .single();

      if (skuError) throw skuError;

      // Upload images if provided
      if (images && images.length > 0) {
        for (const image of images) {
          const fileName = `${tenantId}/${sku.id}/${Date.now()}-${image.name}`;
          const { error: uploadError } = await supabase.storage
            .from('sku-training-images')
            .upload(fileName, image);

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('sku-training-images')
            .getPublicUrl(fileName);

          await supabase.from('sku_images').insert({
            sku_id: sku.id,
            image_url: publicUrl,
          });
        }
      }

      return sku;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product created',
        description: 'Your product has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create product',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SKU> & { id: string }) => {
      const { data, error } = await supabase
        .from('skus')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product updated',
        description: 'Changes saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update product',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('skus').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product deleted',
        description: 'The product has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete product',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const uploadProductImage = useMutation({
    mutationFn: async ({ skuId, file }: { skuId: string; file: File }) => {
      if (!tenantId) throw new Error('No tenant ID');

      const fileName = `${tenantId}/${skuId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('sku-training-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sku-training-images')
        .getPublicUrl(fileName);

      const { data, error } = await supabase
        .from('sku_images')
        .insert({ sku_id: skuId, image_url: publicUrl })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Image uploaded',
        description: 'Training image added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to upload image',
        description: error.message,
        variant: 'destructive',
      });
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
