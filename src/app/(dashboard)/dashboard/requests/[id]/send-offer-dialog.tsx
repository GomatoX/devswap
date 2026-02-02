"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { sendOffer } from "../actions";
import { format } from "date-fns";

interface SendOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  defaultRate: number;
  defaultStartDate: Date | string;
  defaultEndDate: Date | string;
  counterpartyName: string;
  matchmakingFee: number;
}

export function SendOfferDialog({
  open,
  onOpenChange,
  requestId,
  defaultRate,
  defaultStartDate,
  defaultEndDate,
  counterpartyName,
  matchmakingFee,
}: SendOfferDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [offeredRate, setOfferedRate] = useState(defaultRate);
  const [startDate, setStartDate] = useState(
    format(new Date(defaultStartDate), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(
    format(new Date(defaultEndDate), "yyyy-MM-dd"),
  );
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await sendOffer({
      requestId,
      offeredRate,
      offeredStartDate: startDate,
      offeredEndDate: endDate,
      offerNotes: notes || undefined,
    });

    if (result.success) {
      toast.success("Offer sent successfully!");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to send offer");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Offer</DialogTitle>
          <DialogDescription>
            Set your offer terms for {counterpartyName}. They will need to pay
            the matchmaking fee (€{matchmakingFee}) to finalize the deal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rate">Hourly Rate (€) *</Label>
            <Input
              id="rate"
              type="number"
              min={1}
              step={0.01}
              value={offeredRate}
              onChange={(e) => setOfferedRate(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional terms or conditions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <p className="font-medium">What happens next?</p>
            <ul className="mt-1 list-disc list-inside text-muted-foreground space-y-1">
              <li>{counterpartyName} will receive your offer</li>
              <li>They pay the €{matchmakingFee} matchmaking fee to accept</li>
              <li>A contract is created for both parties to sign</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Offer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
