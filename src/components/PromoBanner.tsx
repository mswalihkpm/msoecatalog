import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone } from "lucide-react";

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
    }, 3000);
    return () => clearInterval(interval);
  }, [posters.length]);

  if (posters.length === 0) return null;

  const current = posters[currentIndex];

  const content = (
    <div className="relative w-full overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-primary/20 via-card to-primary/20">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 p-4"
        >
          {current.image_url ? (
            <img
              src={current.image_url}
              alt={current.title}
              className="h-16 w-24 rounded-lg object-cover border border-border flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-24 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded">New</span>
              <h3 className="text-sm font-bold text-foreground truncate">{current.title}</h3>
            </div>
            {current.description && (
              <p className="text-xs text-muted-foreground truncate">{current.description}</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      {posters.length > 1 && (
        <div className="absolute bottom-1.5 right-3 flex gap-1">
          {posters.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${i === currentIndex ? "bg-primary" : "bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return current.book_id ? (
    <Link to={`/book/${current.book_id}`}>{content}</Link>
  ) : (
    content
  );
};
