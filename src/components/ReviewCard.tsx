import { Review } from "@/lib/types";
import { StarRating } from "./StarRating";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <Card className="bg-muted/50 border-border">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-medium text-foreground">{review.userName}</span>
              <StarRating rating={review.rating} readonly size="sm" />
            </div>
            <p className="text-sm text-muted-foreground">{review.comment}</p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {format(new Date(review.createdAt), "MMM d, yyyy")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
