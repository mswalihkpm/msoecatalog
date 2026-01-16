import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, Calendar, User, BookOpen, Image } from "lucide-react";
import { Header } from "@/components/Header";
import { StarRating } from "@/components/StarRating";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getBookById, getReviews } from "@/lib/store";
import { Book, Review } from "@/lib/types";
import { format } from "date-fns";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  const loadData = () => {
    if (id) {
      const bookData = getBookById(id);
      setBook(bookData || null);
      setReviews(getReviews(id));
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8">
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
              Book not found
            </h3>
            <Link to="/">
              <Button variant="outline">Back to Catalog</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Catalog
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Info */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in">
            {/* Cover Image */}
            {book.coverImage ? (
              <div className="w-full max-w-xs">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-auto rounded-lg shadow-card"
                />
              </div>
            ) : (
              <div className="w-full max-w-xs h-64 bg-muted rounded-lg flex items-center justify-center">
                <Image className="h-16 w-16 text-muted-foreground" />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-start gap-3 mb-4">
                <Badge variant="outline">{book.category}</Badge>
                <Badge 
                  variant={book.isBorrowed ? "destructive" : "secondary"}
                  className={book.isBorrowed ? "" : "bg-secondary text-secondary-foreground"}
                >
                  {book.isBorrowed ? "Currently Borrowed" : "Available"}
                </Badge>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
                {book.title}
              </h1>
              <p className="text-lg text-muted-foreground">by {book.author}</p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <StarRating rating={book.averageRating} readonly />
                <span className="font-medium">{book.averageRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({book.totalReviews} reviews)
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                Code: {book.numberCode}
              </span>
              <span className="text-sm text-muted-foreground">
                SI: {book.siNumber}
              </span>
            </div>

            <Separator />

            <div>
              <h2 className="font-serif text-xl font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {book.description || "No description available for this book."}
              </p>
            </div>

            {book.isBorrowed && (
              <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Currently Borrowed</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This book has been borrowed by another member. Please check back later.
                  </p>
                  {book.returnDate && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Expected return: {format(new Date(book.returnDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Reviews Section */}
            <div>
              <h2 className="font-serif text-xl font-semibold mb-4">
                Reviews ({reviews.length})
              </h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>

          {/* Review Form Sidebar */}
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="sticky top-24">
              <ReviewForm bookId={book.id} onReviewAdded={loadData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookDetail;
