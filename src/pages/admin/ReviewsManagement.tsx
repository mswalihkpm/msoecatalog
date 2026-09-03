import { LoadingLogo } from "@/components/LoadingLogo";
import { useState, useEffect, useMemo } from "react";
import { Search, Star, Trash2, BookOpen, Check, EyeOff, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  getReviews,
  getBooks,
  deleteReview,
  updateReviewStatus,
  bulkUpdateReviewStatus,
  type ReviewStatus,
} from "@/lib/store";
import { Review, Book } from "@/lib/types";
import { StarRating } from "@/components/StarRating";
import { format } from "date-fns";
import { toast } from "sonner";

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<ReviewStatus>("pending");
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [reviewsData, booksData] = await Promise.all([
      getReviews(undefined, "all"),
      getBooks(),
    ]);
    setReviews(reviewsData);
    setBooks(booksData);
    setSelected([]);
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

  const handleStatus = async (id: string, status: ReviewStatus) => {
    await updateReviewStatus(id, status);
    toast.success(status === "approved" ? "Review approved" : "Review hidden");
    loadData();
  };

  const handleBulk = async (status: ReviewStatus) => {
    await bulkUpdateReviewStatus(selected, status);
    toast.success(`${selected.length} review(s) ${status === "approved" ? "approved" : "hidden"}`);
    loadData();
  };

  const counts = useMemo(() => ({
    pending: reviews.filter((r) => (r.status ?? "approved") === "pending").length,
    approved: reviews.filter((r) => (r.status ?? "approved") === "approved").length,
    hidden: reviews.filter((r) => r.status === "hidden").length,
  }), [reviews]);

  const filteredReviews = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return reviews.filter((review) => {
      if ((review.status ?? "approved") !== tab) return false;
      if (!query) return true;
      const bookTitle = getBookTitle(review.bookId).toLowerCase();
      return (
        review.userName.toLowerCase().includes(query) ||
        bookTitle.includes(query) ||
        (review.comment && review.comment.toLowerCase().includes(query))
      );
    });
  }, [reviews, searchQuery, books, tab]);

  const allSelected = filteredReviews.length > 0 && filteredReviews.every((r) => selected.includes(r.id));

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <LoadingLogo text="Loading reviews..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Reviews Management</h1>
        <p className="text-muted-foreground">Approve, hide or delete book reviews and ratings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Reviews
              </CardTitle>
              <CardDescription>{reviews.length} total reviews</CardDescription>
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

          <Tabs value={tab} onValueChange={(v) => { setTab(v as ReviewStatus); setSelected([]); }} className="mt-4">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
              <TabsTrigger value="pending" className="gap-2">
                Pending
                {counts.pending > 0 && <Badge variant="destructive">{counts.pending}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
              <TabsTrigger value="hidden">Hidden ({counts.hidden})</TabsTrigger>
            </TabsList>
          </Tabs>

          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">{selected.length} selected</span>
              <Button size="sm" onClick={() => handleBulk("approved")} className="gap-1">
                <Check className="h-4 w-4" /> Approve selected
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulk("hidden")} className="gap-1">
                <EyeOff className="h-4 w-4" /> Hide selected
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="rounded-md border">
            <Table className="min-w-[750px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(v) =>
                        setSelected(v ? filteredReviews.map((r) => r.id) : [])
                      }
                    />
                  </TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Helpful</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No reviews found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(review.id)}
                          onCheckedChange={(v) =>
                            setSelected((prev) =>
                              v ? [...prev, review.id] : prev.filter((id) => id !== review.id)
                            )
                          }
                        />
                      </TableCell>
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
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {review.helpfulCount ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(review.status ?? "approved") !== "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatus(review.id, "approved")}
                            >
                              <Check className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          {(review.status ?? "approved") !== "hidden" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatus(review.id, "hidden")}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}
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
                        </div>
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
