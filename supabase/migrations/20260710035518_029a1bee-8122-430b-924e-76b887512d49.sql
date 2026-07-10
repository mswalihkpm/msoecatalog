
-- 1) Student type + migration tracking
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS student_type text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS migrated_from uuid;

-- Mark all pre-existing students as OLD (only on first run — cannot be re-run easily otherwise)
UPDATE public.students SET student_type = 'old' WHERE student_type = 'new' AND created_at < now();

-- 2) Creativity: category on works + admin-editable category list
ALTER TABLE public.creative_works
  ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS creativity_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS leaderboard_visible_from date;

-- 3) Migration function - transfers all student data from old to new atomically
CREATE OR REPLACE FUNCTION public.migrate_student(old_id uuid, new_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_row public.students%ROWTYPE;
  new_row public.students%ROWTYPE;
BEGIN
  SELECT * INTO old_row FROM public.students WHERE id = old_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Old student not found'; END IF;

  SELECT * INTO new_row FROM public.students WHERE id = new_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'New student not found'; END IF;

  IF old_row.id = new_row.id THEN RAISE EXCEPTION 'Cannot migrate a student into itself'; END IF;

  -- Prevent re-migration
  IF EXISTS (SELECT 1 FROM public.students WHERE migrated_from = old_row.id) THEN
    RAISE EXCEPTION 'This old student has already been migrated';
  END IF;

  -- Move all name-based references
  UPDATE public.borrow_records
    SET borrower_name = new_row.name,
        borrower_class = new_row.class
    WHERE borrower_name = old_row.name;

  UPDATE public.book_requests
    SET requester_name = new_row.name,
        requester_class = new_row.class
    WHERE requester_name = old_row.name;

  UPDATE public.reviews
    SET user_name = new_row.name
    WHERE user_name = old_row.name;

  -- Copy old profile data onto the new account (per user preference: keep OLD passcode)
  UPDATE public.students
    SET code = COALESCE(NULLIF(old_row.code,''), new_row.code),
        house_name = COALESCE(new_row.house_name, old_row.house_name),
        father_name = COALESCE(new_row.father_name, old_row.father_name),
        date_of_birth = COALESCE(new_row.date_of_birth, old_row.date_of_birth),
        student_type = 'new',
        migrated_from = old_row.id,
        updated_at = now()
    WHERE id = new_id;

  DELETE FROM public.students WHERE id = old_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.migrate_student(uuid, uuid) TO anon, authenticated, service_role;
