-- Publication logos table
CREATE TABLE public.publication_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_name text NOT NULL UNIQUE,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.publication_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view publication_logos" ON public.publication_logos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert publication_logos" ON public.publication_logos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update publication_logos" ON public.publication_logos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete publication_logos" ON public.publication_logos FOR DELETE USING (true);

CREATE TRIGGER update_publication_logos_updated_at
BEFORE UPDATE ON public.publication_logos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for publication logos
INSERT INTO storage.buckets (id, name, public) VALUES ('publication-logos', 'publication-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read publication-logos" ON storage.objects FOR SELECT USING (bucket_id = 'publication-logos');
CREATE POLICY "Anyone can upload publication-logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'publication-logos');
CREATE POLICY "Anyone can update publication-logos" ON storage.objects FOR UPDATE USING (bucket_id = 'publication-logos');
CREATE POLICY "Anyone can delete publication-logos" ON storage.objects FOR DELETE USING (bucket_id = 'publication-logos');