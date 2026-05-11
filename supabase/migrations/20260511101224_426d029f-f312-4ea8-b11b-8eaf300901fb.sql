
CREATE TABLE public.store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view store_items" ON public.store_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert store_items" ON public.store_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update store_items" ON public.store_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete store_items" ON public.store_items FOR DELETE USING (true);
CREATE TRIGGER update_store_items_updated_at BEFORE UPDATE ON public.store_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.store_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 0,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view store_reviews" ON public.store_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert store_reviews" ON public.store_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update store_reviews" ON public.store_reviews FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete store_reviews" ON public.store_reviews FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_store_item_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  avg_rating NUMERIC(3,2);
  rating_count INTEGER;
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.item_id, OLD.item_id);
  SELECT COALESCE(AVG(rating),0), COUNT(*) INTO avg_rating, rating_count
    FROM public.store_reviews WHERE item_id = target_id AND rating > 0;
  UPDATE public.store_items SET average_rating = avg_rating, total_reviews = rating_count
    WHERE id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER store_reviews_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.store_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_store_item_rating();

INSERT INTO storage.buckets (id, name, public) VALUES ('store-items', 'store-items', true);
CREATE POLICY "Public read store-items" ON storage.objects FOR SELECT USING (bucket_id = 'store-items');
CREATE POLICY "Anyone can upload store-items" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'store-items');
CREATE POLICY "Anyone can update store-items" ON storage.objects FOR UPDATE USING (bucket_id = 'store-items');
CREATE POLICY "Anyone can delete store-items" ON storage.objects FOR DELETE USING (bucket_id = 'store-items');
