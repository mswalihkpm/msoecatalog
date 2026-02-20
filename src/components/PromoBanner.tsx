import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, ChevronLeft, ChevronRight } from "lucide-react";

interface Poster {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  book_id: string | null;
}

export const PromoBanner = () => {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchPosters = async () => {
      const { data } = await supabase
        .from("promotional_posters")
        .select("id, title, description, image_url, book_id")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (data && data.length > 0) setPosters(data);
    };
    fetchPosters();
  }, []);

  useEffect(() => {
    if (posters.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posters.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [posters.length]);

  if (posters.length === 0) return null;

  const current = posters[currentIndex];

  const goTo = (i: number) => setCurrentIndex((i + posters.length) % posters.length);

  const slide = (
    <div className="relative w-full overflow-hidden rounded-xl bg-card border border-border shadow-md group" style={{ aspectRatio: "16/5" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {current.image_url ? (
            <img
              src={current.image_url}
              alt={current.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-card to-primary/10 flex flex-col items-center justify-center gap-3 p-8">
              <Megaphone className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-bold text-foreground text-center">{current.title}</h3>
              {current.description && (
                <p className="text-sm text-muted-foreground text-center max-w-md">{current.description}</p>
              )}
            </div>
          )}
          {/* Overlay text for image posters */}
          {current.image_url && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:p-6">
              <h3 className="text-white font-bold text-lg md:text-xl leading-tight">{current.title}</h3>
              {current.description && (
                <p className="text-white/80 text-sm mt-1">{current.description}</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Arrow buttons */}
      {posters.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); goTo(currentIndex - 1); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); goTo(currentIndex + 1); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {posters.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {posters.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); goTo(i); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "bg-white w-5" : "bg-white/50 w-1.5"}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return current.book_id ? (
    <Link to={`/book/${current.book_id}`} className="block w-full">{slide}</Link>
  ) : (
    slide
  );
};

