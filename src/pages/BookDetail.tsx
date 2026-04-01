import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, Calendar, User, BookOpen, Image, Send, Hash, FileText, Building } from "lucide-react";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { StarRating } from "@/components/StarRating";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import { StudentSearch } from "@/components/StudentSearch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getBookById, getReviews, addBookRequest } from "@/lib/store";
import { Book, Review, Student } from "@/lib/types";
import { format } from "date-fns";
import { toast } from "sonner";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [daysToReturn, setDaysToReturn] = useState<string>("");

  const calculatedReturnDate = useMemo(() => {
    const days = parseInt(daysToReturn);
    if (!days || days <= 0) return null;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }, [daysToReturn]);

  const loadData = async () => {
    if (id) {
      const bookData = await getBookById(id);
      setBook(bookData || null);
      const reviewsData = await getReviews(id);
      setReviews(reviewsData);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadData();
  }, [id]);

  const handleRequestBook = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }
    if (!book) return;

    await addBookRequest({
      bookId: book.id,
      bookTitle: book.title,
      bookNumberCode: book.numberCode,
      bookVolume: book.volume,
      requesterName: selectedStudent.name,
      requesterClass: selectedStudent.class,
    });

    toast.success("Request submitted successfully!");
    setIsRequestDialogOpen(false);
    setSelectedStudent(null);
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-background relative">
        <AnimatedBackground />
        <Header />
        <main className="container px-4 py-8 relative z-10">
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
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="container px-4 py-8 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Browse</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cover Image */}
          <div className="animate-fade-in">
            <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 shadow-teal">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="aspect-[3/4] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <BookOpen className="h-24 w-24 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Book Info */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-primary text-primary-foreground font-semibold uppercase text-xs px-4 py-1.5">
                {book.category}
              </Badge>
              {book.volume && (
                <Badge variant="outline" className="border-primary/30 text-foreground">
                  Volume {book.volume}
                </Badge>
              )}
              <Badge 
                className={`font-semibold text-xs px-4 py-1.5 ${
                  book.isBorrowed 
                    ? "bg-destructive text-destructive-foreground" 
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {book.isBorrowed ? "BORROWED" : "AVAILABLE"}
              </Badge>
            </div>

            {/* Title & Author */}
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
                {book.title}
              </h1>
              <p className="text-lg text-muted-foreground">by {book.author}</p>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-serif text-lg font-semibold mb-2 text-foreground">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {book.description || "No description available for this book."}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {book.publication && (
                <Card className="bg-muted/30 border-primary/10">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Publisher</p>
                      <p className="font-semibold text-foreground">{book.publication}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="bg-muted/30 border-primary/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">ISBN</p>
                    <p className="font-semibold text-foreground">{book.numberCode}</p>
                  </div>
                </CardContent>
              </Card>
              {book.pages && (
                <Card className="bg-muted/30 border-primary/10">
                  <CardContent className="p-4 flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Pages</p>
                      <p className="font-semibold text-foreground">{book.pages}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="bg-muted/30 border-primary/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Copies</p>
                    <p className="font-semibold text-foreground">1</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Tags:</span>
              <Badge variant="outline" className="text-xs">#{book.category.toLowerCase()}</Badge>
              <Badge variant="outline" className="text-xs">#{book.title.split(' ')[0].toLowerCase()}</Badge>
            </div>

            {/* Request Button */}
            {book.isBorrowed ? (
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
            ) : (
              <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 py-6 text-base font-semibold">
                    <BookOpen className="h-5 w-5" />
                    Request Book
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-serif">Request Book</DialogTitle>
                    <DialogDescription>
                      Fill in your details to request "{book.title}"
                      {book.volume && ` (Volume ${book.volume})`}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Requester *</Label>
                      <StudentSearch
                        onSelect={setSelectedStudent}
                        selectedStudent={selectedStudent}
                        placeholder="Search student name..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRequestBook}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Submit Request
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Separator className="my-12" />

        {/* Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 animate-fade-in">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Reviews & Ratings
            </h2>
            
            {/* Review Form */}
            <Card className="bg-card border-primary/10">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg font-semibold mb-4">Leave a Review</h3>
                <ReviewForm bookId={book.id} onReviewAdded={loadData} />
              </CardContent>
            </Card>

            {/* Existing Reviews - only show reviews with comments */}
            {reviews.filter(r => r.comment && r.comment.trim()).length > 0 ? (
              <div className="space-y-4">
                {reviews
                  .filter(r => r.comment && r.comment.trim())
                  .map((review) => (
                    <ReviewCard key={review.id} review={review} onDelete={loadData} />
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No reviews yet. Be the first to review this book!
              </p>
            )}
          </div>

          {/* Rating Summary */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Card className="bg-card border-primary/10 sticky top-24">
              <CardContent className="p-6 text-center">
                <div className="text-5xl font-bold text-foreground mb-2">
                  {book.averageRating.toFixed(1)}
                </div>
                <StarRating rating={book.averageRating} readonly size="lg" />
                <p className="text-muted-foreground mt-2">
                  Based on {book.totalReviews} rating{book.totalReviews !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookDetail;
