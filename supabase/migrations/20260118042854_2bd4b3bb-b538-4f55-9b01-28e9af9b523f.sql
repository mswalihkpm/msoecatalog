-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  si_number TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  number_code TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  volume TEXT,
  pages TEXT,
  publication TEXT,
  is_borrowed BOOLEAN NOT NULL DEFAULT false,
  borrowed_by TEXT,
  borrowed_date DATE,
  return_date DATE,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create borrow_records table
CREATE TABLE public.borrow_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  book_volume TEXT,
  borrower_name TEXT NOT NULL,
  borrower_class TEXT,
  borrowed_date DATE NOT NULL,
  return_date DATE NOT NULL,
  is_returned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create book_requests table
CREATE TABLE public.book_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  book_number_code TEXT NOT NULL,
  book_volume TEXT,
  requester_name TEXT NOT NULL,
  requester_class TEXT NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_settings table
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL DEFAULT 'msoelib',
  password TEXT NOT NULL DEFAULT 'alif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Books: Public read, admin write (for now, allow all operations as there's no auth)
CREATE POLICY "Anyone can view books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Anyone can insert books" ON public.books FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update books" ON public.books FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete books" ON public.books FOR DELETE USING (true);

-- Reviews: Public read and write
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reviews" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete reviews" ON public.reviews FOR DELETE USING (true);

-- Borrow Records: Public read, admin write (for now, allow all)
CREATE POLICY "Anyone can view borrow_records" ON public.borrow_records FOR SELECT USING (true);
CREATE POLICY "Anyone can insert borrow_records" ON public.borrow_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update borrow_records" ON public.borrow_records FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete borrow_records" ON public.borrow_records FOR DELETE USING (true);

-- Book Requests: Public read and write
CREATE POLICY "Anyone can view book_requests" ON public.book_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert book_requests" ON public.book_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update book_requests" ON public.book_requests FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete book_requests" ON public.book_requests FOR DELETE USING (true);

-- Admin Settings: Restricted access (for now, allow all - will add proper auth later)
CREATE POLICY "Anyone can view admin_settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can update admin_settings" ON public.admin_settings FOR UPDATE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update book rating when reviews change
CREATE OR REPLACE FUNCTION public.update_book_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC(3,2);
  review_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT COALESCE(AVG(rating), 0), COUNT(*) INTO avg_rating, review_count
    FROM public.reviews WHERE book_id = OLD.book_id;
    
    UPDATE public.books 
    SET average_rating = avg_rating, total_reviews = review_count 
    WHERE id = OLD.book_id;
    
    RETURN OLD;
  ELSE
    SELECT COALESCE(AVG(rating), 0), COUNT(*) INTO avg_rating, review_count
    FROM public.reviews WHERE book_id = NEW.book_id;
    
    UPDATE public.books 
    SET average_rating = avg_rating, total_reviews = review_count 
    WHERE id = NEW.book_id;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update book rating on review changes
CREATE TRIGGER update_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_book_rating();

-- Insert initial admin settings
INSERT INTO public.admin_settings (username, password) VALUES ('msoelib', 'alif');

-- Insert sample books
INSERT INTO public.books (si_number, title, author, category, number_code, description, volume, pages, publication, is_borrowed, average_rating, total_reviews) VALUES
  ('001', 'Stories of the Prophets', 'Ibn Kathir', 'Islamic', 'ISL-001', 'A collection of stories about the prophets in Islamic tradition.', '1', '450', 'Dar us-Salam Publications', false, 4.9, 2),
  ('002', 'The Alchemist', 'Paulo Coelho', 'Novel', 'NOV-001', 'A magical fable about following your dreams and listening to your heart.', NULL, '208', 'HarperOne', false, 4.5, 1),
  ('003', 'Steve Jobs', 'Walter Isaacson', 'Biography', 'BIO-001', 'The exclusive biography of Steve Jobs based on exclusive interviews.', NULL, '656', 'Simon & Schuster', true, 4.8, 0),
  ('004', 'A Brief History of Time', 'Stephen Hawking', 'Science', 'SCI-001', 'A landmark volume in science writing exploring the universe.', NULL, '256', 'Bantam', false, 4.6, 0),
  ('005', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'History', 'HIS-001', 'A groundbreaking narrative of humanity''s creation and evolution.', NULL, '443', 'Harper', true, 4.7, 0),
  ('006', 'Arabic Through the Quran', 'Alan Jones', 'Arabic', 'ARB-001', 'An educational text for learning Arabic through Quranic study.', NULL, '256', 'Islamic Texts Society', false, 4.4, 0);