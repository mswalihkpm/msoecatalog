import { Link } from "react-router-dom";
import { Star, BookOpen, Image } from "lucide-react";
import { Book } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface BookCardProps {
  book: Book;
}

export const BookCard = ({ book }: BookCardProps) => {
  return (
    <Link to={`/book/${book.id}`}>
      <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-gold hover:-translate-y-1 bg-card border-border">
        {/* Cover Image */}
        {book.coverImage ? (
          <div className="h-40 overflow-hidden">
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-40 bg-muted flex items-center justify-center">
            <Image className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
            </div>
            <div className="flex-shrink-0">
              <Badge 
                variant={book.isBorrowed ? "destructive" : "secondary"}
                className={book.isBorrowed ? "" : "bg-secondary text-secondary-foreground"}
              >
                {book.isBorrowed ? "Borrowed" : "Available"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {book.description || "No description available."}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="outline" className="text-xs">
              {book.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Code: {book.numberCode}
            </span>
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium">{book.averageRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({book.totalReviews} reviews)
            </span>
          </div>
          <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardFooter>
      </Card>
    </Link>
  );
};
