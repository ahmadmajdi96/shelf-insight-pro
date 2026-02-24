
-- Datasets table
CREATE TABLE public.datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  image_count integer NOT NULL DEFAULT 0,
  class_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all datasets"
ON public.datasets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Dataset images table
CREATE TABLE public.dataset_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  file_name text,
  annotations jsonb DEFAULT '[]'::jsonb,
  is_annotated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dataset_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all dataset images"
ON public.dataset_images FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Dataset classes (SKU classes for annotation)
CREATE TABLE public.dataset_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dataset_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all dataset classes"
ON public.dataset_classes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Training jobs table
CREATE TABLE public.training_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  model_type text NOT NULL DEFAULT 'yolov8',
  epochs integer NOT NULL DEFAULT 100,
  batch_size integer NOT NULL DEFAULT 16,
  progress numeric DEFAULT 0,
  result_url text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.training_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all training jobs"
ON public.training_jobs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON public.datasets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_jobs_updated_at BEFORE UPDATE ON public.training_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for dataset images
INSERT INTO storage.buckets (id, name, public) VALUES ('dataset-images', 'dataset-images', true);

CREATE POLICY "Admins can upload dataset images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dataset-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view dataset images"
ON storage.objects FOR SELECT
USING (bucket_id = 'dataset-images');

CREATE POLICY "Admins can delete dataset images"
ON storage.objects FOR DELETE
USING (bucket_id = 'dataset-images' AND has_role(auth.uid(), 'admin'::app_role));
