
-- Add width column to shelves (stored in centimeters)
ALTER TABLE public.shelves ADD COLUMN IF NOT EXISTS width_cm numeric DEFAULT NULL;
