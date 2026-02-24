-- Allow all authenticated users to manage datasets and related tables
-- Since auth is handled by the custom backend, we need permissive policies

CREATE POLICY "Authenticated users can manage datasets"
ON public.datasets FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage dataset images"
ON public.dataset_images FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage dataset classes"
ON public.dataset_classes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage training jobs"
ON public.training_jobs FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow anon role since the app uses anon key
CREATE POLICY "Anon can manage datasets"
ON public.datasets FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can manage dataset images"
ON public.dataset_images FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can manage dataset classes"
ON public.dataset_classes FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can manage training jobs"
ON public.training_jobs FOR ALL
TO anon
USING (true)
WITH CHECK (true);