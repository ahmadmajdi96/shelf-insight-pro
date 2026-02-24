import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  status: string;
  image_count: number;
  class_count: number;
  created_by: string | null;
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
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Dataset[];
    },
  });

  const createDataset = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('datasets')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['datasets'] });
      toast({ title: 'Dataset created' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateDataset = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; description?: string; status?: string; image_count?: number; class_count?: number }) => {
      const { error } = await supabase.from('datasets').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['datasets'] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteDataset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('datasets').delete().eq('id', id);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('dataset_images')
        .select('*')
        .eq('dataset_id', datasetId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as DatasetImage[];
    },
    enabled: !!datasetId,
  });

  const uploadImages = useMutation({
    mutationFn: async ({ datasetId, files }: { datasetId: string; files: File[] }) => {
      const uploaded: DatasetImage[] = [];
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
          .insert({ dataset_id: datasetId, image_url: publicUrl, file_name: file.name })
          .select()
          .single();
        if (error) throw error;
        uploaded.push(data as DatasetImage);
      }
      // Update image count
      await supabase.from('datasets').update({ image_count: (images.length || 0) + files.length }).eq('id', datasetId);
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
      const { error } = await supabase
        .from('dataset_images')
        .update({ annotations: annotations as any, is_annotated: annotations.length > 0 })
        .eq('id', imageId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dataset-images', datasetId] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteImage = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase.from('dataset_images').delete().eq('id', imageId);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('dataset_classes')
        .select('*')
        .eq('dataset_id', datasetId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as DatasetClass[];
    },
    enabled: !!datasetId,
  });

  const createClass = useMutation({
    mutationFn: async (payload: { dataset_id: string; name: string; color?: string }) => {
      const { data, error } = await supabase
        .from('dataset_classes')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dataset-classes', datasetId] });
      qc.invalidateQueries({ queryKey: ['datasets'] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateClass = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; color?: string }) => {
      const { error } = await supabase.from('dataset_classes').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dataset-classes', datasetId] }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteClass = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dataset_classes').delete().eq('id', id);
      if (error) throw error;
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
      let query = supabase.from('training_jobs').select('*').order('created_at', { ascending: false });
      if (datasetId) query = query.eq('dataset_id', datasetId);
      const { data, error } = await query;
      if (error) throw error;
      return data as TrainingJob[];
    },
  });

  const createJob = useMutation({
    mutationFn: async (payload: { dataset_id: string; epochs?: number; batch_size?: number }) => {
      const { data, error } = await supabase
        .from('training_jobs')
        .insert({ ...payload, status: 'pending' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training-jobs'] });
      toast({ title: 'Training job created' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { jobs, isLoading, createJob };
}
