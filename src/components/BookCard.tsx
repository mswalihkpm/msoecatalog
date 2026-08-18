import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Book } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { GeneratedCover } from "@/components/GeneratedCover";

interface BookCardProps {
  book: Book;
  onOpen?: () => void;
  hasPendingRequest?: boolean;
  pendingRequestCount?: number;
}

export const BookCard = ({ book, onOpen, hasPendingRequest = false, pendingRequestCount = 0 }: BookCardProps) => {
  const getAvailabilityStatus = () => {
    if (book.isBorrowed) {
      return { label: "BORROWED", className: "bg-destructive text-destructive-foreground" };
    }
    if (pendingRequestCount > 0) {
      return { label: "RESERVED", className: "bg-amber-500 text-white" };
    }
    return { label: "AVAILABLE", className: "bg-emerald-500 text-white" };
  };

  const status = getAvailabilityStatus();

  return (
    <Link to={`/book/${book.id}`} onClick={onOpen}>
      <div className={`group relative h-full overflow-hidden rounded-xl border-2 bg-card transition-all duration-300 hover:-translate-y-1 ${hasPendingRequest ? "border-destructive/50 hover:border-destructive hover:shadow-[0_0_25px_hsl(var(--destructive)/0.4)]" : "border-primary/20 hover:border-primary/50 hover:shadow-teal"}`}>
        {/* Cover Image Container */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <GeneratedCover
              title={book.title}
              author={book.author}
              publication={book.publication}
              className="w-full h-full"
            />
          )}
          
          {/* Category Badge - Top Left */}
          <Badge 
            className="absolute top-2 left-2 bg-primary text-primary-foreground font-semibold uppercase text-[10px] px-2 py-0.5"
          >
            {book.category}
          </Badge>
          
          {/* Availability Badge - Top Right */}
          <Badge 
            className={`absolute top-2 right-2 font-bold uppercase text-[10px] px-2 py-0.5 shadow-sm ${status.className}`}
          >
            {status.label}
          </Badge>

          {/* Red shading overlay and request count when book has pending requests */}
          {(hasPendingRequest || pendingRequestCount > 0) && (
            <>
              <div className="absolute inset-0 bg-amber-500/20 pointer-events-none" />
              <Badge className="absolute bottom-2 left-2 bg-amber-500 text-white font-semibold uppercase text-[10px] px-2 py-0.5">
                {pendingRequestCount > 1 ? `${pendingRequestCount} Requests` : "Requested"}
              </Badge>
            </>
          )}

          {/* Gradient Overlay at Bottom - removed shading */}
        </div>

        {/* Book Info */}
        <div className="p-2 sm:p-3 space-y-1 sm:space-y-1.5">
          <h3 className="font-serif text-[11px] sm:text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {book.title}
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide line-clamp-1">
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
