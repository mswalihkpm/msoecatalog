
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS manager_password TEXT NOT NULL DEFAULT '123123',
  ADD COLUMN IF NOT EXISTS novel_notice TEXT NOT NULL DEFAULT 'Novel category books require manager approval before borrowing. Your request will first be reviewed by the manager. Click Next to continue.';

ALTER TABLE public.book_requests DROP CONSTRAINT IF EXISTS book_requests_status_check;
ALTER TABLE public.book_requests ADD CONSTRAINT book_requests_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'manager_pending'::text, 'manager_rejected'::text]));
