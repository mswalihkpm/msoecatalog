import { useState } from "react";
import { StarRating } from "./StarRating";
import { StudentSearch } from "./StudentSearch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addReview } from "@/lib/store";
import { Student } from "@/lib/types";
import { toast } from "sonner";
import { Star, MessageSquare } from "lucide-react";

interface ReviewFormProps {
  bookId: string;
  onReviewAdded: () => void;
}

export const ReviewForm = ({ bookId, onReviewAdded }: ReviewFormProps) => {
  const [selectedStudentForRating, setSelectedStudentForRating] = useState<Student | null>(null);
  const [selectedStudentForReview, setSelectedStudentForReview] = useState<Student | null>(null);
  const [ratingOnly, setRatingOnly] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentForRating) {
      toast.error("Please select a student");
      return;
    }
    if (ratingOnly === 0) {
      toast.error("Please select a rating");
      return;
    }

    await addReview({
      bookId,
      userName: "Anonymous", // Rating is anonymous
      rating: ratingOnly,
      comment: "", // No comment for rating-only
    });

    toast.success("Rating submitted successfully!");
    setSelectedStudentForRating(null);
    setRatingOnly(0);
    onReviewAdded();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentForReview) {
      toast.error("Please select a student");
      return;
    }
    if (reviewRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a review");
      return;
    }

    await addReview({
      bookId,
      userName: selectedStudentForReview.name, // Show reviewer name
      rating: reviewRating,
      comment: comment.trim(),
    });

    toast.success("Review submitted successfully!");
    setSelectedStudentForReview(null);
    setReviewRating(0);
    setComment("");
    onReviewAdded();
  };

  return (
    <Tabs defaultValue="rating" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="rating" className="gap-2">
          <Star className="h-4 w-4" />
          Rate Only
        </TabsTrigger>
        <TabsTrigger value="review" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Write Review
        </TabsTrigger>
      </TabsList>

      <TabsContent value="rating">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Rate this Book</CardTitle>
            <p className="text-sm text-muted-foreground">Your rating will be shown as "Anonymous"</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Your Name</Label>
                <StudentSearch
                  onSelect={setSelectedStudentForRating}
                  selectedStudent={selectedStudentForRating}
                  placeholder="Search your name..."
                />
              </div>
              <div className="space-y-2">
                <Label>Your Rating</Label>
                <StarRating rating={ratingOnly} onRatingChange={setRatingOnly} size="lg" />
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                Submit Rating
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="review">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Write a Review</CardTitle>
            <p className="text-sm text-muted-foreground">Your name will be shown with your review</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Your Name</Label>
                <StudentSearch
                  onSelect={setSelectedStudentForReview}
                  selectedStudent={selectedStudentForReview}
                  placeholder="Search your name..."
                />
              </div>
              <div className="space-y-2">
                <Label>Your Rating</Label>
                <StarRating rating={reviewRating} onRatingChange={setReviewRating} size="lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Your Review</Label>
                <Textarea
                  id="comment"
                  placeholder="Share your thoughts about this book..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                Submit Review
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
