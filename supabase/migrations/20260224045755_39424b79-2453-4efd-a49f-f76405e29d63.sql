
-- Allow anyone to upload to dataset-images bucket
CREATE POLICY "Allow public upload to dataset-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dataset-images');

-- Allow anyone to read from dataset-images bucket
CREATE POLICY "Allow public read from dataset-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'dataset-images');

-- Allow anyone to update in dataset-images bucket
CREATE POLICY "Allow public update in dataset-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'dataset-images');

-- Allow anyone to delete from dataset-images bucket
CREATE POLICY "Allow public delete from dataset-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'dataset-images');
