import { Review } from "@/lib/types";
import { StarRating } from "./StarRating";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { deleteReview } from "@/lib/store";
import { toast } from "sonner";

interface ReviewCardProps {
  review: Review;
  onDelete?: () => void;
  showDeleteButton?: boolean;
}

export const ReviewCard = ({ review, onDelete, showDeleteButton = false }: ReviewCardProps) => {
  const handleDelete = async () => {
    await deleteReview(review.id);
    toast.success("Review deleted successfully");
    onDelete?.();
  };

  return (
    <Card className="bg-muted/50 border-border">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {review.userName && review.userName !== "Anonymous" && (
                <span className="font-medium text-foreground">{review.userName}</span>
              )}
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(review.createdAt), "MMM d, yyyy")}
            </span>
            {showDeleteButton && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
