import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, Calendar, User, BookOpen, Image, Send, Hash, FileText, Building } from "lucide-react";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { StarRating } from "@/components/StarRating";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import { StudentSearch } from "@/components/StudentSearch";
import { GeneratedCover } from "@/components/GeneratedCover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getBookById, getReviews, addBookRequest, getPendingRequestCount, getStudentPendingRequestCount, getAdminSettings, hasStudentRequestedBook, getStudentPendingRequestForBook, deleteBookRequest } from "@/lib/store";
import { Book, Review, Student } from "@/lib/types";
import { format } from "date-fns";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [daysToReturn, setDaysToReturn] = useState<string>("");
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [userQueuePosition, setUserQueuePosition] = useState<number | null>(null);
  const [studentPendingCount, setStudentPendingCount] = useState<number>(0);
  const [libraryOpenDate, setLibraryOpenDate] = useState<Date | null>(null);
  const [alreadyRequestedSameBook, setAlreadyRequestedSameBook] = useState(false);
  const [existingRequestId, setExistingRequestId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [novelNotice, setNovelNotice] = useState<string>("");
  const [showNovelNotice, setShowNovelNotice] = useState(false);

  const borrowDate = useMemo(() => {
    if (!libraryOpenDate) return null;
    return libraryOpenDate;
  }, [libraryOpenDate]);

  const calculatedReturnDate = useMemo(() => {
    const days = parseInt(daysToReturn);
    if (!days || days <= 0 || !borrowDate) return null;
    const date = new Date(borrowDate);
    date.setDate(date.getDate() + days);
    return date;
  }, [daysToReturn, borrowDate]);

  const loadData = async () => {
    const settings = await getAdminSettings();
    if (settings.libraryOpenDate) {
      setLibraryOpenDate(new Date(settings.libraryOpenDate + "T00:00:00"));
    }
    setNovelNotice(settings.novelNotice || "");
    if (id) {
      const bookData = await getBookById(id);
      setBook(bookData || null);
      const reviewsData = await getReviews(id);
      setReviews(reviewsData);
      const count = await getPendingRequestCount(id);
      setPendingCount(count);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadData();
  }, [id]);

  useEffect(() => {
    const checkStudentLimit = async () => {
      if (selectedStudent && id) {
        const count = await getStudentPendingRequestCount(selectedStudent.name);
        setStudentPendingCount(count);
        const existing = await getStudentPendingRequestForBook(selectedStudent.name, id);
        setExistingRequestId(existing?.id ?? null);
        setAlreadyRequestedSameBook(!!existing);
      } else {
        setStudentPendingCount(0);
        setAlreadyRequestedSameBook(false);
        setExistingRequestId(null);
      }
    };
    checkStudentLimit();
  }, [selectedStudent, id]);

  const handleCancelRequest = async () => {
    if (!existingRequestId) return;
    setIsCancelling(true);
    try {
      await deleteBookRequest(existingRequestId);
      toast.success("Your request has been cancelled.");
      setExistingRequestId(null);
      setAlreadyRequestedSameBook(false);
      setStudentPendingCount(prev => Math.max(0, prev - 1));
      setPendingCount(prev => Math.max(0, prev - 1));
      setUserQueuePosition(null);
      setIsRequestDialogOpen(false);
      setSelectedStudent(null);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRequestBook = async () => {
    if (isSubmitting) return;
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }
    if (!book) return;

    const maxSlots = book.isBorrowed ? 4 : 3;
    if (pendingCount >= maxSlots) {
      toast.error(`Maximum ${maxSlots} requests allowed for this book. Please try later.`);
      return;
    }

    if (studentPendingCount >= 2) {
      toast.error("You already have 2 pending requests. Return old books first.");
      return;
    }

    if (alreadyRequestedSameBook) {
      toast.error("You have already requested this same book before!");
      return;
    }

    setIsSubmitting(true);
    try {
      const isNovel = book.category?.toLowerCase() === "novel";
      await addBookRequest(
        {
          bookId: book.id,
          bookTitle: book.title,
          bookNumberCode: book.numberCode,
          bookVolume: book.volume,
          requesterName: selectedStudent.name,
          requesterClass: selectedStudent.class,
          returnDate: calculatedReturnDate ? format(calculatedReturnDate, "yyyy-MM-dd") : undefined,
        },
        isNovel ? "manager_pending" : "pending"
      );

      const newPosition = pendingCount + 1;
      setUserQueuePosition(newPosition);
      setPendingCount(newPosition);
      setStudentPendingCount(prev => prev + 1);
      setAlreadyRequestedSameBook(true);
      if (isNovel) {
        toast.success("Request sent to manager for approval.");
      } else {
        toast.success(`Request submitted! You are person #${newPosition} in the queue.`);
      }
      setIsRequestDialogOpen(false);
      setSelectedStudent(null);
      setDaysToReturn("");
    } finally {
      setIsSubmitting(false);
    }
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
                <GeneratedCover
                  title={book.title}
                  author={book.author}
                  publication={book.publication}
                  className="w-full h-auto aspect-[3/4]"
                />
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
              <div className="space-y-4">
                {/* Queue info */}
                {pendingCount > 0 && (
                  <Card className="bg-muted/30 border-primary/20">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-foreground">
                        📋 {pendingCount} student{pendingCount !== 1 ? 's have' : ' has'} already requested this book.
                      </p>
                      {userQueuePosition && (
                        <p className="text-sm text-primary font-semibold mt-1">
                          You are person #{userQueuePosition} in the queue.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {userQueuePosition && (
                  <Alert className="border-primary/20 bg-primary/5">
                    <AlertDescription className="text-sm text-muted-foreground italic">
                      Note: If the first student doesn't take the book, the second or third can get it; if the first takes it, the others won't.
                    </AlertDescription>
                  </Alert>
                )}

                {(() => {
                  const maxSlots = book.isBorrowed ? 4 : 3;
                  const slotsLeft = Math.max(0, maxSlots - pendingCount);
                  return pendingCount >= maxSlots ? (
                  <Card className="bg-destructive/10 border-destructive/20">
                    <CardContent className="pt-4">
                      <p className="font-medium text-destructive">Maximum requests reached</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {maxSlots} students have already requested this book. Please check back later.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 py-6 text-base font-semibold">
                        <BookOpen className="h-5 w-5" />
                        Request Book ({slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left)
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
                        {pendingCount > 0 && (
                          <Alert className="border-primary/20 bg-primary/5">
                            <AlertDescription className="text-sm">
                              {pendingCount} student{pendingCount !== 1 ? 's have' : ' has'} already requested this book. You will be person #{pendingCount + 1}.
                            </AlertDescription>
                          </Alert>
                        )}
                        <div className="space-y-2">
                          <Label>Requester *</Label>
                          <StudentSearch
                            onSelect={setSelectedStudent}
                            selectedStudent={selectedStudent}
                            placeholder="Search student name..."
                          />
                          {selectedStudent && studentPendingCount >= 2 && (
                            <Alert className="border-destructive/20 bg-destructive/5 mt-2">
                              <AlertDescription className="text-sm text-destructive font-medium">
                                ⚠️ You already have {studentPendingCount} pending request{studentPendingCount !== 1 ? 's' : ''}. A student can only request 2 books at a time. Please return your borrowed books first before requesting a new one.
                              </AlertDescription>
                            </Alert>
                          )}
                          {selectedStudent && alreadyRequestedSameBook && (
                            <Alert className="border-destructive/20 bg-destructive/5 mt-2">
                              <AlertDescription className="text-sm text-destructive font-medium">
                                ⚠️ You have already requested this book. You can cancel your request below if you no longer need it.
                              </AlertDescription>
                            </Alert>
                          )}
                          {selectedStudent && studentPendingCount === 1 && !alreadyRequestedSameBook && (
                            <Alert className="border-yellow-500/20 bg-yellow-500/5 mt-2">
                              <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-400">
                                📌 You have 1 pending request. You can request 1 more book. After that, you must return old books to request again.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Days to return *</Label>
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            placeholder="Enter number of days (max 20)"
                            value={daysToReturn}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 20)) {
                                setDaysToReturn(val);
                              }
                            }}
                          />
                          {parseInt(daysToReturn) > 20 && (
                            <p className="text-sm text-destructive">Maximum 20 days allowed</p>
                          )}
                          {calculatedReturnDate && borrowDate && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Borrow date: <span className="font-semibold text-foreground">{format(borrowDate, "MMM d, yyyy")}</span>
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Return by: <span className="font-semibold text-foreground">{format(calculatedReturnDate, "MMM d, yyyy")}</span>
                              </p>
                            </div>
                          )}
                        </div>
                        <Alert className="border-muted bg-muted/30">
                          <AlertDescription className="text-xs text-muted-foreground italic">
                            Note: If the first student doesn't take the book, the second or third can get it; if the first takes it, the others won't.
                          </AlertDescription>
                        </Alert>
                      </div>
                      <DialogFooter className="gap-2 sm:gap-2">
                        <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                          Close
                        </Button>
                        {alreadyRequestedSameBook && existingRequestId && (
                          <Button
                            variant="destructive"
                            onClick={handleCancelRequest}
                            disabled={isCancelling}
                          >
                            {isCancelling ? "Cancelling..." : "Cancel My Request"}
                          </Button>
                        )}
                        <Button
                          onClick={handleRequestBook}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          disabled={isSubmitting || (selectedStudent !== null && studentPendingCount >= 2) || alreadyRequestedSameBook}
                        >
                          {isSubmitting ? "Submitting..." : "Submit Request"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                );
                })()}
              </div>
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
