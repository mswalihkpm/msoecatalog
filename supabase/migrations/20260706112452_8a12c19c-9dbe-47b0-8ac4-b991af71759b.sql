
-- Leaderboard admin management fields
ALTER TABLE public.borrow_records
  ADD COLUMN IF NOT EXISTS read_status TEXT NOT NULL DEFAULT 'not_read',
  ADD COLUMN IF NOT EXISTS review_conducted BOOLEAN NOT NULL DEFAULT false;

-- Admin settings for leaderboard controls
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS leaderboard_notice TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS leaderboard_visible BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS leaderboard_visible_until DATE,
  ADD COLUMN IF NOT EXISTS leaderboard_from_date DATE;

-- Snapshots of past leaderboards
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  from_date DATE,
  until_date DATE,
  entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  notice TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leaderboard_snapshots TO anon, authenticated;
GRANT ALL ON public.leaderboard_snapshots TO service_role;

ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard snapshots"
  ON public.leaderboard_snapshots FOR SELECT USING (true);
CREATE POLICY "Anyone can manage leaderboard snapshots"
  ON public.leaderboard_snapshots FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_leaderboard_snapshots_updated_at
  BEFORE UPDATE ON public.leaderboard_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
