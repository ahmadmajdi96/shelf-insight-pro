import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Category = Tables<'product_categories'>;
type CategoryInsert = TablesInsert<'product_categories'>;

interface CategoryWithCounts extends Category {
  productCount: number;
  trainedCount: number;
}

export function useCategories() {
  const { tenantId, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['categories', tenantId, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('product_categories')
        .select('*')
        .order('name', { ascending: true });

      if (!isAdmin && tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data: categories, error } = await query;
      if (error) throw error;

      // Get product counts for each category
      const categoriesWithCounts: CategoryWithCounts[] = await Promise.all(
        categories.map(async (category) => {
          const { count: productCount } = await supabase
            .from('skus')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          const { count: trainedCount } = await supabase
            .from('skus')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('training_status', 'completed');

          return {
            ...category,
            productCount: productCount ?? 0,
            trainedCount: trainedCount ?? 0,
          };
        })
      );

      return categoriesWithCounts;
    },
    enabled: !!tenantId || isAdmin,
  });

  const createCategory = useMutation({
    mutationFn: async (category: Omit<CategoryInsert, 'tenant_id'>) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('product_categories')
        .insert({ ...category, tenant_id: tenantId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Category created',
        description: 'Your category has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create category',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from('product_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Category updated',
        description: 'Changes saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update category',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Category deleted',
        description: 'The category has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete category',
        description: error.message,
        variant: 'destructive',
      });
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
