-- 1. SPR student id on students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS spr_student_id text;
CREATE UNIQUE INDEX IF NOT EXISTS students_spr_student_id_key
  ON public.students (spr_student_id) WHERE spr_student_id IS NOT NULL;

-- 2. Nullable student references on reading tables
ALTER TABLE public.borrow_records ADD COLUMN IF NOT EXISTS student_id uuid
  REFERENCES public.students(id) ON DELETE SET NULL;
ALTER TABLE public.book_requests ADD COLUMN IF NOT EXISTS student_id uuid
  REFERENCES public.students(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS student_id uuid
  REFERENCES public.students(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS borrow_records_student_id_idx ON public.borrow_records (student_id);
CREATE INDEX IF NOT EXISTS book_requests_student_id_idx ON public.book_requests (student_id);
CREATE INDEX IF NOT EXISTS reviews_student_id_idx ON public.reviews (student_id);

-- 3. Safe backfill: only when exactly one student matches (case/space-insensitive)
WITH norm AS (
  SELECT id, upper(btrim(name)) AS n, upper(btrim(class)) AS c FROM public.students
), uniq AS (
  SELECT n, c, (min(id::text))::uuid AS sid FROM norm GROUP BY n, c HAVING count(*) = 1
)
UPDATE public.borrow_records br SET student_id = u.sid
FROM uniq u
WHERE br.student_id IS NULL
  AND upper(btrim(br.borrower_name)) = u.n
  AND upper(btrim(coalesce(br.borrower_class, ''))) = u.c;

WITH norm AS (
  SELECT id, upper(btrim(name)) AS n, upper(btrim(class)) AS c FROM public.students
), uniq AS (
  SELECT n, c, (min(id::text))::uuid AS sid FROM norm GROUP BY n, c HAVING count(*) = 1
)
UPDATE public.book_requests brq SET student_id = u.sid
FROM uniq u
WHERE brq.student_id IS NULL
  AND upper(btrim(brq.requester_name)) = u.n
  AND upper(btrim(coalesce(brq.requester_class, ''))) = u.c;

-- reviews only carry a name: match only when the name maps to exactly one student overall
WITH uniq_name AS (
  SELECT upper(btrim(name)) AS n, (min(id::text))::uuid AS sid
  FROM public.students GROUP BY upper(btrim(name)) HAVING count(*) = 1
)
UPDATE public.reviews r SET student_id = u.sid
FROM uniq_name u
WHERE r.student_id IS NULL AND upper(btrim(r.user_name)) = u.n;

-- 4. Admin migration report view (no sensitive student fields)
CREATE OR REPLACE VIEW public.spr_migration_report AS
WITH s AS (
  SELECT upper(btrim(name)) AS n, upper(btrim(class)) AS c, count(*) AS cnt
  FROM public.students GROUP BY 1, 2
), sn AS (
  SELECT upper(btrim(name)) AS n, count(*) AS cnt FROM public.students GROUP BY 1
)
SELECT 'borrow_records'::text AS source_table, br.id AS record_id,
       br.borrower_name AS student_name, br.borrower_class AS student_class,
       br.book_title, br.borrowed_date AS record_date,
       CASE WHEN coalesce(s.cnt, 0) = 0 THEN 'no_match' ELSE 'ambiguous' END AS reason
FROM public.borrow_records br
LEFT JOIN s ON s.n = upper(btrim(br.borrower_name)) AND s.c = upper(btrim(coalesce(br.borrower_class, '')))
WHERE br.student_id IS NULL
UNION ALL
SELECT 'book_requests', brq.id, brq.requester_name, brq.requester_class,
       brq.book_title, brq.request_date,
       CASE WHEN coalesce(s.cnt, 0) = 0 THEN 'no_match' ELSE 'ambiguous' END
FROM public.book_requests brq
LEFT JOIN s ON s.n = upper(btrim(brq.requester_name)) AND s.c = upper(btrim(coalesce(brq.requester_class, '')))
WHERE brq.student_id IS NULL
UNION ALL
SELECT 'reviews', r.id, r.user_name, NULL, NULL, r.created_at::date,
       CASE WHEN coalesce(sn.cnt, 0) = 0 THEN 'no_match' ELSE 'ambiguous' END
FROM public.reviews r
LEFT JOIN sn ON sn.n = upper(btrim(r.user_name))
WHERE r.student_id IS NULL;

GRANT SELECT ON public.spr_migration_report TO anon, authenticated;
GRANT ALL ON public.spr_migration_report TO service_role;