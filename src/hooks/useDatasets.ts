import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rest, storage } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  status: string;
  image_count: number;
  class_count: number;
  created_by: string | null;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatasetImage {
  id: string;
  dataset_id: string;
  image_url: string;
  file_name: string | null;
  annotations: any[];
  is_annotated: boolean;
  created_at: string;
}

export interface DatasetClass {
  id: string;
  dataset_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TrainingJob {
  id: string;
  dataset_id: string;
  status: string;
  model_type: string;
  epochs: number;
  batch_size: number;
  progress: number;
  result_url: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Datasets ────────────────────────────────────────────
export function useDatasets() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: datasets = [], isLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: async () => {
      const { data } = await rest.list('datasets', { select: '*', order: 'created_at.desc' });
      return (data || []) as Dataset[];
    },
  });

  const createDataset = useMutation({
    mutationFn: async (payload: { name: string; description?: string; tenant_id?: string }) => {
      return await rest.create('datasets', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['datasets'] });
      toast({ title: 'Dataset created' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateDataset = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; description?: string; status?: string; image_count?: number; class_count?: number }) => {
      await rest.update('datasets', { id: `eq.${id}` }, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['datasets'] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteDataset = useMutation({
    mutationFn: async (id: string) => {
      await rest.remove('datasets', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['datasets'] });
      toast({ title: 'Dataset deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { datasets, isLoading, createDataset, updateDataset, deleteDataset };
}

// ─── Dataset Images ──────────────────────────────────────
export function useDatasetImages(datasetId: string | null) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['dataset-images', datasetId],
    queryFn: async () => {
      if (!datasetId) return [];
      const { data } = await rest.list('dataset_images', {
        select: '*',
        filters: { dataset_id: `eq.${datasetId}` },
        order: 'created_at.asc',
      });
      return (data || []) as DatasetImage[];
    },
    enabled: !!datasetId,
  });

  const uploadImages = useMutation({
    mutationFn: async ({ datasetId, files }: { datasetId: string; files: File[] }) => {
      const uploaded: DatasetImage[] = [];
      for (const file of files) {
        const path = `${datasetId}/${crypto.randomUUID()}-${file.name}`;
        await storage.upload('dataset-images', path, file);
        const publicUrl = storage.getPublicUrl('dataset-images', path);

        const data = await rest.create('dataset_images', {
          dataset_id: datasetId,
          image_url: publicUrl,
          file_name: file.name,
        });
        uploaded.push(data as DatasetImage);
      }
      // Update image count
      await rest.update('datasets', { id: `eq.${datasetId}` }, {
        image_count: (images.length || 0) + files.length,
      });
      return uploaded;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['dataset-images', vars.datasetId] });
      qc.invalidateQueries({ queryKey: ['datasets'] });
      toast({ title: 'Images uploaded' });
    },
    onError: (e: any) => toast({ title: 'Upload failed', description: e.message, variant: 'destructive' }),
  });

  const updateAnnotations = useMutation({
    mutationFn: async ({ imageId, annotations }: { imageId: string; annotations: any[] }) => {
      await rest.update('dataset_images', { id: `eq.${imageId}` }, {
        annotations: annotations as any,
        is_annotated: annotations.length > 0,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dataset-images', datasetId] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteImage = useMutation({
    mutationFn: async (imageId: string) => {
      await rest.remove('dataset_images', imageId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dataset-images', datasetId] });
      qc.invalidateQueries({ queryKey: ['datasets'] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { images, isLoading, uploadImages, updateAnnotations, deleteImage };
}

// ─── Dataset Classes ─────────────────────────────────────
export function useDatasetClasses(datasetId: string | null) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['dataset-classes', datasetId],
    queryFn: async () => {
      if (!datasetId) return [];
      const { data } = await rest.list('dataset_classes', {
        select: '*',
        filters: { dataset_id: `eq.${datasetId}` },
        order: 'created_at.asc',
      });
      return (data || []) as DatasetClass[];
    },
    enabled: !!datasetId,
  });

  const createClass = useMutation({
    mutationFn: async (payload: { dataset_id: string; name: string; color?: string }) => {
      return await rest.create('dataset_classes', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dataset-classes', datasetId] });
      qc.invalidateQueries({ queryKey: ['datasets'] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateClass = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; color?: string }) => {
      await rest.update('dataset_classes', { id: `eq.${id}` }, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dataset-classes', datasetId] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteClass = useMutation({
    mutationFn: async (id: string) => {
      await rest.remove('dataset_classes', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dataset-classes', datasetId] });
      qc.invalidateQueries({ queryKey: ['datasets'] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { classes, isLoading, createClass, updateClass, deleteClass };
}

// ─── Training Jobs ───────────────────────────────────────
export function useTrainingJobs(datasetId?: string | null) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['training-jobs', datasetId],
    queryFn: async () => {
      const opts: any = { select: '*', order: 'created_at.desc' };
      if (datasetId) opts.filters = { dataset_id: `eq.${datasetId}` };
      const { data } = await rest.list('training_jobs', opts);
      return (data || []) as TrainingJob[];
    },
  });

  const createJob = useMutation({
    mutationFn: async (payload: { dataset_id: string; epochs?: number; batch_size?: number }) => {
      return await rest.create('training_jobs', { ...payload, status: 'pending' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training-jobs'] });
      toast({ title: 'Training job created' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { jobs, isLoading, createJob };
}
