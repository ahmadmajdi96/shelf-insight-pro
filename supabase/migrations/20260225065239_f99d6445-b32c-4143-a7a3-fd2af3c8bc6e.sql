
-- Create image sets table to group uploaded images
CREATE TABLE public.dataset_image_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_trained BOOLEAN NOT NULL DEFAULT false,
  image_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add image_set_id to dataset_images
ALTER TABLE public.dataset_images
ADD COLUMN image_set_id UUID REFERENCES public.dataset_image_sets(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.dataset_image_sets ENABLE ROW LEVEL SECURITY;

-- RLS policies matching existing dataset pattern
CREATE POLICY "Authenticated users can manage image sets"
ON public.dataset_image_sets FOR ALL
USING (true) WITH CHECK (true);

CREATE POLICY "Anon can manage image sets"
ON public.dataset_image_sets FOR ALL
USING (true) WITH CHECK (true);
