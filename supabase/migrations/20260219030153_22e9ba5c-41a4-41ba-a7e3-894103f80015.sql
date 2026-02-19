
-- Create promotional posters table
CREATE TABLE public.promotional_posters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotional_posters ENABLE ROW LEVEL SECURITY;

-- Public read access for everyone
CREATE POLICY "Anyone can view active posters"
ON public.promotional_posters
FOR SELECT
USING (true);

-- Full access for all operations (admin managed via session auth)
CREATE POLICY "Allow all poster management"
ON public.promotional_posters
FOR ALL
USING (true)
WITH CHECK (true);
