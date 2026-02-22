import { useState, useEffect, useMemo } from "react";
import { Search, Star, Trash2, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getReviews, getBooks, deleteReview } from "@/lib/store";
import { Review, Book } from "@/lib/types";
import { StarRating } from "@/components/StarRating";
import { format } from "date-fns";
import { toast } from "sonner";

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [reviewsData, booksData] = await Promise.all([
      getReviews(),
      getBooks(),
    ]);
    setReviews(reviewsData);
    setBooks(booksData);
    setIsLoading(false);
  };

  const getBookTitle = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    return book?.title || "Unknown Book";
  };

  const handleDeleteReview = async (id: string) => {
    await deleteReview(id);
    toast.success("Review deleted successfully");
    loadData();
  };

  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews;
    const query = searchQuery.toLowerCase();
    return reviews.filter((review) => {
      const bookTitle = getBookTitle(review.bookId).toLowerCase();
      return (
        review.userName.toLowerCase().includes(query) ||
        bookTitle.includes(query) ||
        (review.comment && review.comment.toLowerCase().includes(query))
      );
    });
  }, [reviews, searchQuery, books]);

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-pulse">
          <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Reviews Management</h1>
        <p className="text-muted-foreground">Manage all book reviews and ratings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                All Reviews
              </CardTitle>
              <CardDescription>
                {reviews.length} total reviews
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="rounded-md border">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No reviews found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium max-w-[150px] truncate">
                            {getBookTitle(review.bookId)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{review.userName}</Badge>
                      </TableCell>
                      <TableCell>
                        <StarRating rating={review.rating} readonly size="sm" />
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {review.comment || <span className="italic">No comment</span>}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this review by {review.userName}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteReview(review.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsManagement;
