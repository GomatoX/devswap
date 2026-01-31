"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { createRating } from "./rating-actions";
import { cn } from "@/lib/utils";

type RatingDialogProps = {
  requestId: string;
  counterpartyName: string;
  hasExistingRating: boolean;
};

export function RatingDialog({
  requestId,
  counterpartyName,
  hasExistingRating,
}: RatingDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    const result = await createRating({
      requestId,
      score,
      comment: comment || undefined,
    });

    if (result.success) {
      toast.success("Rating submitted!");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to submit rating");
    }
    setLoading(false);
  };

  if (hasExistingRating) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          <Star className="h-4 w-4 mr-2" />
          Leave a Rating
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your experience working with {counterpartyName}?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onClick={() => setScore(value)}
                  onMouseEnter={() => setHoveredScore(value)}
                  onMouseLeave={() => setHoveredScore(0)}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hoveredScore || score) >= value
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground",
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {score === 1 && "Poor"}
              {score === 2 && "Fair"}
              {score === 3 && "Good"}
              {score === 4 && "Very Good"}
              {score === 5 && "Excellent"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || score === 0}>
              {loading ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Display component for showing existing ratings
export function RatingDisplay({
  score,
  comment,
  fromCompanyName,
}: {
  score: number;
  comment?: string | null;
  fromCompanyName: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={cn(
                "h-4 w-4",
                value <= score
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground",
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{score}/5</span>
      </div>
      {comment && (
        <p className="text-sm text-muted-foreground">&quot;{comment}&quot;</p>
      )}
      <p className="text-xs text-muted-foreground">— {fromCompanyName}</p>
    </div>
  );
}
