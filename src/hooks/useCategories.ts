import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CategoryWithCounts {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  productCount: number;
  trainedCount: number;
}

export function useCategories() {
  const { user, tenantId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Fetch categories and skus in parallel (no N+1)
      const [catRes, skusRes] = await Promise.all([
        rest.list('product_categories', { select: '*', order: 'name.asc' }),
        rest.list('skus', { select: 'id,category_id,training_status' }),
      ]);

      const categories = catRes.data || [];
      const skus = skusRes.data || [];

      // Count by category_id client-side
      const productCounts = new Map<string, number>();
      const trainedCounts = new Map<string, number>();
      skus.forEach((s: any) => {
        if (s.category_id) {
          productCounts.set(s.category_id, (productCounts.get(s.category_id) || 0) + 1);
          if (s.training_status === 'completed') {
            trainedCounts.set(s.category_id, (trainedCounts.get(s.category_id) || 0) + 1);
          }
        }
      });

      return categories.map((cat: any): CategoryWithCounts => ({
        ...cat,
        productCount: productCounts.get(cat.id) || 0,
        trainedCount: trainedCounts.get(cat.id) || 0,
      }));
    },
    enabled: !!user,
  });

  const createCategory = useMutation({
    mutationFn: async (category: any) => {
      const tid = category.tenant_id || tenantId;
      if (!tid) throw new Error('No tenant ID');
      return rest.create('product_categories', { ...category, tenant_id: tid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category created', description: 'Your category has been added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create category', description: error.message, variant: 'destructive' });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: any) => rest.update('product_categories', { id: `eq.${id}` }, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category updated', description: 'Changes saved successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update category', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => { await rest.remove('product_categories', id); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category deleted', description: 'The category has been removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete category', description: error.message, variant: 'destructive' });
    },
  });

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
