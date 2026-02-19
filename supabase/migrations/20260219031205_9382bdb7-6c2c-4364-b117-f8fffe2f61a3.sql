
INSERT INTO storage.buckets (id, name, public) VALUES ('promotional-posters', 'promotional-posters', true);

CREATE POLICY "Anyone can view promotional posters" ON storage.objects FOR SELECT USING (bucket_id = 'promotional-posters');
CREATE POLICY "Anyone can upload promotional posters" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'promotional-posters');
CREATE POLICY "Anyone can update promotional posters" ON storage.objects FOR UPDATE USING (bucket_id = 'promotional-posters');
CREATE POLICY "Anyone can delete promotional posters" ON storage.objects FOR DELETE USING (bucket_id = 'promotional-posters');
