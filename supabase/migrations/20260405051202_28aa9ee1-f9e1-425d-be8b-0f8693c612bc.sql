
CREATE OR REPLACE FUNCTION public.update_book_rating()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  avg_rating NUMERIC(3,2);
  rating_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT COALESCE(AVG(rating), 0), COUNT(*) INTO avg_rating, rating_count
    FROM public.reviews WHERE book_id = OLD.book_id AND rating > 0;
    
    UPDATE public.books 
    SET average_rating = avg_rating, total_reviews = rating_count
    WHERE id = OLD.book_id;
    
    RETURN OLD;
  ELSE
    SELECT COALESCE(AVG(rating), 0), COUNT(*) INTO avg_rating, rating_count
    FROM public.reviews WHERE book_id = NEW.book_id AND rating > 0;
    
    UPDATE public.books 
    SET average_rating = avg_rating, total_reviews = rating_count
    WHERE id = NEW.book_id;
    
    RETURN NEW;
  END IF;
END;
$function$;
