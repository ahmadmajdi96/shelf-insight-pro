import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ImageSet {
  id: string;
  dataset_id: string;
  name: string;
  is_trained: boolean;
  image_count: number;
  created_at: string;
}

export function useImageSets(datasetId: string | null) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: imageSets = [], isLoading } = useQuery({
    queryKey: ['image-sets', datasetId],
    queryFn: async () => {
      if (!datasetId) return [];
      const { data, error } = await supabase
        .from('dataset_image_sets')
        .select('*')
        .eq('dataset_id', datasetId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ImageSet[];
    },
    enabled: !!datasetId,
  });

  const createImageSet = useMutation({
    mutationFn: async (payload: { dataset_id: string; name: string }) => {
      const { data, error } = await supabase
        .from('dataset_image_sets')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as ImageSet;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['image-sets', datasetId] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateImageSet = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; is_trained?: boolean; image_count?: number }) => {
      const { error } = await supabase.from('dataset_image_sets').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['image-sets', datasetId] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteImageSet = useMutation({
    mutationFn: async (id: string) => {
      // Delete associated images first
      const { error: imgErr } = await supabase
        .from('dataset_images')
        .delete()
        .eq('image_set_id', id);
      if (imgErr) throw imgErr;
      const { error } = await supabase.from('dataset_image_sets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['image-sets', datasetId] });
      qc.invalidateQueries({ queryKey: ['dataset-images', datasetId] });
      qc.invalidateQueries({ queryKey: ['datasets'] });
      toast({ title: 'Image set deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { imageSets, isLoading, createImageSet, updateImageSet, deleteImageSet };
}

// Upload images to a specific set
export function useImageSetUpload() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const uploadToSet = useMutation({
    mutationFn: async ({ datasetId, imageSetId, files }: { datasetId: string; imageSetId: string; files: File[] }) => {
      const uploaded: any[] = [];
      for (const file of files) {
        const path = `${datasetId}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('dataset-images')
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('dataset-images')
          .getPublicUrl(path);

        const { data, error } = await supabase
          .from('dataset_images')
          .insert({
            dataset_id: datasetId,
            image_url: publicUrl,
            file_name: file.name,
            image_set_id: imageSetId,
          })
          .select()
          .single();
        if (error) throw error;
        uploaded.push(data);
      }
      return uploaded;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['dataset-images', vars.datasetId] });
      qc.invalidateQueries({ queryKey: ['image-sets', vars.datasetId] });
      qc.invalidateQueries({ queryKey: ['datasets'] });
    },
    onError: (e: any) => toast({ title: 'Upload failed', description: e.message, variant: 'destructive' }),
  });

  return { uploadToSet };
}
