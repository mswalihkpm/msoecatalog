
-- 1. Students: profile fields for forgot-passcode verification
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS house_name TEXT,
  ADD COLUMN IF NOT EXISTS father_name TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth TEXT;

-- 2. Admin settings: editable scoring table + optional review-points override
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS scoring_table JSONB,
  ADD COLUMN IF NOT EXISTS review_points_default INTEGER DEFAULT 10;

-- Seed default scoring table from the user's provided figure
UPDATE public.admin_settings
SET scoring_table = '{
  "Islamic":       {"b50":10,"b100":15,"b150":20,"b200":25,"b250":30,"b300":35,"a300":50},
  "General":       {"b50":8, "b100":13,"b150":18,"b200":23,"b250":28,"b300":33,"a300":48},
  "Science":       {"b50":8, "b100":13,"b150":17,"b200":22,"b250":27,"b300":32,"a300":47},
  "History":       {"b50":8, "b100":13,"b150":17,"b200":22,"b250":27,"b300":32,"a300":47},
  "English":       {"b50":7, "b100":12,"b150":17,"b200":22,"b250":27,"b300":32,"a300":47},
  "Autobiography": {"b50":7, "b100":12,"b150":17,"b200":23,"b250":28,"b300":33,"a300":48},
  "Biography":     {"b50":7, "b100":12,"b150":17,"b200":23,"b250":28,"b300":33,"a300":48},
  "Travelogue":    {"b50":6, "b100":11,"b150":16,"b200":21,"b250":26,"b300":31,"a300":46},
  "Arabic":        {"b50":6, "b100":11,"b150":16,"b200":22,"b250":27,"b300":32,"a300":47},
  "Poem":          {"b50":5, "b100":10,"b150":15,"b200":20,"b250":25,"b300":30,"a300":45},
  "English Novel": {"b50":5, "b100":10,"b150":15,"b200":20,"b250":26,"b300":33,"a300":48},
  "Story":         {"b50":4, "b100":9, "b150":14,"b200":22,"b250":25,"b300":31,"a300":46},
  "Novel":         {"b50":4, "b100":9, "b150":14,"b200":22,"b250":25,"b300":32,"a300":47},
  "English Story": {"b50":3, "b100":6, "b150":10,"b200":15,"b250":24,"b300":35,"a300":40},
  "Language":      {"b50":6, "b100":11,"b150":16,"b200":22,"b250":27,"b300":32,"a300":47},
  "Others":        {"b50":3, "b100":6, "b150":10,"b200":15,"b250":20,"b300":25,"a300":35}
}'::jsonb
WHERE scoring_table IS NULL;

-- 3. Creativity Hub uploads
CREATE TABLE IF NOT EXISTS public.creative_works (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  writer TEXT,
  media TEXT,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,           -- 'image' | 'pdf' | 'video'
  cover_url TEXT,                    -- optional cover for PDFs
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.creative_works TO anon, authenticated;
GRANT ALL ON public.creative_works TO service_role;

ALTER TABLE public.creative_works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creative works"
  ON public.creative_works FOR SELECT USING (true);
CREATE POLICY "Anyone can insert creative works"
  ON public.creative_works FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update creative works"
  ON public.creative_works FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete creative works"
  ON public.creative_works FOR DELETE USING (true);

CREATE TRIGGER update_creative_works_updated_at
  BEFORE UPDATE ON public.creative_works
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
