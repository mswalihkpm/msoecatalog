
CREATE POLICY "creative-works read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'creative-works');

CREATE POLICY "creative-works insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'creative-works');

CREATE POLICY "creative-works update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'creative-works');

CREATE POLICY "creative-works delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'creative-works');
