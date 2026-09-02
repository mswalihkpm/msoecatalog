ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0;

UPDATE public.reviews SET status = 'approved' WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS reviews_status_idx ON public.reviews (status);

CREATE TABLE IF NOT EXISTS public.review_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  voter_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (review_id, voter_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_votes TO authenticated;
GRANT ALL ON public.review_votes TO service_role;

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review_votes" ON public.review_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert review_votes" ON public.review_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete review_votes" ON public.review_votes FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.sync_review_helpful_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target uuid;
BEGIN
  target := COALESCE(NEW.review_id, OLD.review_id);
  UPDATE public.reviews
    SET helpful_count = (SELECT COUNT(*) FROM public.review_votes WHERE review_id = target)
    WHERE id = target;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS review_votes_count_trigger ON public.review_votes;
CREATE TRIGGER review_votes_count_trigger
AFTER INSERT OR DELETE ON public.review_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_review_helpful_count();

CREATE OR REPLACE FUNCTION public.update_book_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC(3,2);
  rating_count INTEGER;
  target_book uuid;
BEGIN
  target_book := COALESCE(NEW.book_id, OLD.book_id);

  SELECT COALESCE(AVG(rating), 0), COUNT(*) INTO avg_rating, rating_count
  FROM public.reviews
  WHERE book_id = target_book AND rating > 0 AND status = 'approved';

  UPDATE public.books
  SET average_rating = avg_rating, total_reviews = rating_count
  WHERE id = target_book;

  RETURN COALESCE(NEW, OLD);
END;
$$;