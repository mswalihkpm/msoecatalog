CREATE TABLE public.reading_rate_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  points_per_10_pages numeric(10,4) NOT NULL,
  effective_from timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reading_rate_versions TO anon, authenticated;
GRANT ALL ON public.reading_rate_versions TO service_role;
ALTER TABLE public.reading_rate_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reading rates are publicly readable" ON public.reading_rate_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Reading rate versions are append only" ON public.reading_rate_versions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE UNIQUE INDEX reading_rate_versions_category_effective_from_idx ON public.reading_rate_versions (category, effective_from);

ALTER TABLE public.borrow_records
  ADD COLUMN IF NOT EXISTS return_option text,
  ADD COLUMN IF NOT EXISTS pages_used numeric(10,2),
  ADD COLUMN IF NOT EXISTS rate_used numeric(10,4),
  ADD COLUMN IF NOT EXISTS rate_version_id uuid REFERENCES public.reading_rate_versions(id),
  ADD COLUMN IF NOT EXISTS calculated_points numeric(12,6),
  ADD COLUMN IF NOT EXISTS returned_at timestamptz;
CREATE INDEX IF NOT EXISTS borrow_records_rate_version_id_idx ON public.borrow_records (rate_version_id);