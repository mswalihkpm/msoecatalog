ALTER TABLE public.books ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'library';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_missing boolean NOT NULL DEFAULT false;
ALTER TABLE public.borrow_records ADD COLUMN IF NOT EXISTS pages_read integer;