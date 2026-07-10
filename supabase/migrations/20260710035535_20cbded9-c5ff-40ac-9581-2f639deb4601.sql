ALTER TABLE public.borrow_records
  ADD COLUMN IF NOT EXISTS review_points integer;