import { Link } from "react-router-dom";
import { Star, BookOpen, Image } from "lucide-react";
import { Book } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
  book: Book;
  onOpen?: () => void;
}

export const BookCard = ({ book, onOpen }: BookCardProps) => {
  return (
    <Link to={`/book/${book.id}`} onClick={onOpen}>
      <div className="group relative h-full overflow-hidden rounded-xl border-2 border-primary/20 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-teal hover:-translate-y-1">
        {/* Cover Image Container */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Category Badge - Top Left */}
          <Badge 
            className="absolute top-2 left-2 bg-primary text-primary-foreground font-semibold uppercase text-[10px] px-2 py-0.5"
          >
            {book.category}
          </Badge>
          
          {/* Availability Badge - Top Right */}
          <Badge 
            className={`absolute top-2 right-2 font-semibold text-[10px] px-2 py-0.5 ${
              book.isBorrowed 
                ? "bg-destructive text-destructive-foreground" 
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {book.isBorrowed ? "BORROWED" : "AVAILABLE"}
          </Badge>

          {/* Gradient Overlay at Bottom - removed shading */}
        </div>

        {/* Book Info */}
        <div className="p-3 space-y-1.5">
          <h3 className="font-serif text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide line-clamp-1">
            {book.author}
          </p>
          
          {/* Rating and Code */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="text-xs font-semibold text-foreground">{book.averageRating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {book.numberCode}
            </span>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
             style={{ boxShadow: "inset 0 0 30px hsl(174 72% 50% / 0.1)" }} />
      </div>
    </Link>
  );
};
