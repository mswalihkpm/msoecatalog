import { useState } from "react";
import { Review } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import { deleteReview, voteReviewHelpful, removeReviewVote } from "@/lib/store";
import { toast } from "sonner";

export interface ReviewerStat {
  count: number;
  helpful: number;
}

export const getReviewerBadges = (stat?: ReviewerStat): string[] => {
  if (!stat) return [];
  const badges: string[] = [];
  if (stat.count >= 25) badges.push("Top Reviewer");
  else if (stat.count >= 10) badges.push("Star Reviewer");
  else if (stat.count >= 3) badges.push("Active Reviewer");
  else if (stat.count >= 1) badges.push("New Reviewer");
  if (stat.helpful >= 10) badges.push("Helpful Voice");
  return badges;
};

interface ReviewCardProps {
  review: Review;
  onDelete?: () => void;
  showDeleteButton?: boolean;
  reviewerStat?: ReviewerStat;
  hasVoted?: boolean;
  showHelpful?: boolean;
  onVoteChange?: () => void;
}

export const ReviewCard = ({
  review,
  onDelete,
  showDeleteButton = false,
  reviewerStat,
  hasVoted = false,
  showHelpful = false,
  onVoteChange,
}: ReviewCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [voted, setVoted] = useState(hasVoted);
  const [count, setCount] = useState(review.helpfulCount ?? 0);
  const [voting, setVoting] = useState(false);

  const handleDelete = async () => {
    await deleteReview(review.id);
    toast.success("Review deleted successfully");
    onDelete?.();
  };

  const handleVote = async () => {
    if (voting) return;
    setVoting(true);
    if (voted) {
      await removeReviewVote(review.id);
      setVoted(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      await voteReviewHelpful(review.id);
      setVoted(true);
      setCount((c) => c + 1);
    }
    setVoting(false);
    onVoteChange?.();
  };

  const badges = getReviewerBadges(reviewerStat);
  const wordCount = review.comment ? review.comment.trim().split(/\s+/).filter(Boolean).length : 0;
  const shouldTruncate = wordCount > 45;
  const displayComment = shouldTruncate && !isExpanded
    ? review.comment!.trim().split(/\s+/).filter(Boolean).slice(0, 45).join(" ") + "..."
    : review.comment;

  return (
    <Card className="bg-muted/50 border-border">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {review.userName && review.userName !== "Anonymous" && (
                <span className="font-medium text-foreground">{review.userName}</span>
              )}
              {badges.map((b) => (
                <Badge key={b} variant="secondary" className="text-[10px] uppercase tracking-wide">
                  {b}
                </Badge>
              ))}
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {displayComment}
              </p>
            )}
            {shouldTruncate && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-sm font-medium text-primary hover:underline focus:outline-none"
              >
                {isExpanded ? "Read less" : "Read more"}
              </button>
            )}
            {showHelpful && (
              <Button
                type="button"
                variant={voted ? "default" : "outline"}
                size="sm"
                className="mt-3 h-7 gap-1.5 text-xs"
                onClick={handleVote}
                disabled={voting}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                Helpful {count > 0 && `(${count})`}
              </Button>
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
