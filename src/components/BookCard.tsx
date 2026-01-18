import { Link } from "react-router-dom";
import { Star, BookOpen, Image } from "lucide-react";
import { Book } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
  book: Book;
}

export const BookCard = ({ book }: BookCardProps) => {
  return (
    <Link to={`/book/${book.id}`}>
      <div className="group relative h-full overflow-hidden rounded-xl border-2 border-primary/20 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-teal hover:-translate-y-1">
        {/* Cover Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Category Badge - Top Left */}
          <Badge 
            className="absolute top-3 left-3 bg-primary text-primary-foreground font-semibold uppercase text-xs px-3 py-1"
          >
            {book.category}
          </Badge>
          
          {/* Availability Badge - Top Right */}
          <Badge 
            className={`absolute top-3 right-3 font-semibold text-xs px-3 py-1 ${
              book.isBorrowed 
                ? "bg-destructive text-destructive-foreground" 
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {book.isBorrowed ? "BORROWED" : "AVAILABLE"}
          </Badge>

          {/* Gradient Overlay at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-card via-card/80 to-transparent" />
        </div>

        {/* Book Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-serif text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
            {book.author}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {book.description || "No description available."}
          </p>
          
          {/* Rating and Code */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-semibold text-foreground">{book.averageRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({book.totalReviews})</span>
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
