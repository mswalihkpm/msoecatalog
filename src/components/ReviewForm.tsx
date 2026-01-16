import { useState } from "react";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addReview } from "@/lib/store";
import { toast } from "sonner";

interface ReviewFormProps {
  bookId: string;
  onReviewAdded: () => void;
}

export const ReviewForm = ({ bookId, onReviewAdded }: ReviewFormProps) => {
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a review");
      return;
    }

    addReview({
      bookId,
      userName: userName.trim(),
      rating,
      comment: comment.trim(),
    });

    toast.success("Review added successfully!");
    setUserName("");
    setRating(0);
    setComment("");
    onReviewAdded();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-serif text-lg">Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName">Your Name</Label>
            <Input
              id="userName"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating rating={rating} onRatingChange={setRating} size="lg" />
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
  );
};
