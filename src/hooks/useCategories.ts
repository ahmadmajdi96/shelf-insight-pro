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
  const { isAdmin, tenantId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data: categories } = await rest.list('product_categories', {
        select: '*',
        order: 'name.asc',
      });

      const categoriesWithCounts: CategoryWithCounts[] = await Promise.all(
        (categories || []).map(async (category: any) => {
          const { data: allSkus } = await rest.list('skus', {
            select: '*',
            filters: { category_id: `eq.${category.id}` },
          });

          const { data: trainedSkus } = await rest.list('skus', {
            select: '*',
            filters: { category_id: `eq.${category.id}`, training_status: 'eq.completed' },
          });

          return {
            ...category,
            productCount: allSkus?.length ?? 0,
            trainedCount: trainedSkus?.length ?? 0,
          };
        })
      );

      return categoriesWithCounts;
    },
    enabled: isAdmin,
  });

  const createCategory = useMutation({
    mutationFn: async (category: any) => {
      const tid = category.tenant_id || tenantId;
      if (!tid) throw new Error('No tenant ID');
      return await rest.create('product_categories', { ...category, tenant_id: tid });
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
    mutationFn: async ({ id, ...updates }: any) => {
      return await rest.update('product_categories', { id: `eq.${id}` }, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category updated', description: 'Changes saved successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update category', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      await rest.remove('product_categories', id);
    },
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
