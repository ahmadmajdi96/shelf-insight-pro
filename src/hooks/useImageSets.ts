import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rest, storage } from '@/lib/api-client';
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
      const { data } = await rest.list('dataset_image_sets', {
        select: '*',
        filters: { dataset_id: `eq.${datasetId}` },
        order: 'created_at.desc',
      });
      return (data || []) as ImageSet[];
    },
    enabled: !!datasetId,
  });

  const createImageSet = useMutation({
    mutationFn: async (payload: { dataset_id: string; name: string }) => {
      return await rest.create('dataset_image_sets', payload) as ImageSet;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['image-sets', datasetId] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateImageSet = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; is_trained?: boolean; image_count?: number }) => {
      await rest.update('dataset_image_sets', { id: `eq.${id}` }, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['image-sets', datasetId] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteImageSet = useMutation({
    mutationFn: async (id: string) => {
      // Delete associated images first
      const { data: imgs } = await rest.list('dataset_images', {
        select: 'id',
        filters: { image_set_id: `eq.${id}` },
      });
      for (const img of (imgs || [])) {
        await rest.remove('dataset_images', img.id);
      }
      await rest.remove('dataset_image_sets', id);
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
      const CONCURRENCY = 4;
      for (let i = 0; i < files.length; i += CONCURRENCY) {
        const batch = files.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          batch.map(async (file) => {
            const path = `${datasetId}/${crypto.randomUUID()}-${file.name}`;
            await storage.upload('dataset-images', path, file);
            const publicUrl = storage.getPublicUrl('dataset-images', path);
            return rest.create('dataset_images', {
              dataset_id: datasetId,
              image_url: publicUrl,
              file_name: file.name,
              image_set_id: imageSetId,
            });
          })
        );
        uploaded.push(...results);
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
