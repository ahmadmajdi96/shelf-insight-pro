
-- Allow authenticated users to read sku_images
CREATE POLICY "Authenticated users can view sku images"
ON public.sku_images FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert sku_images
CREATE POLICY "Authenticated users can insert sku images"
ON public.sku_images FOR INSERT
TO authenticated
WITH CHECK (true);
