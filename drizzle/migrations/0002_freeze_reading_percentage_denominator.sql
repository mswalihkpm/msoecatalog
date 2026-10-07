ALTER TABLE public.borrow_records
  ADD COLUMN IF NOT EXISTS max_possible_points numeric(12,6);