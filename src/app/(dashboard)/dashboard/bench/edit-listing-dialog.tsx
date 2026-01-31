"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateListing } from "../market/actions";

type Listing = {
  id: string;
  availableFrom: Date | string;
  availableTo?: Date | string | null;
  hourlyRate: number | { toString(): string };
  workType: string;
  minDuration: number;
  status: string;
};

type EditListingDialogProps = {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export function EditListingDialog({
  listing,
  open,
  onOpenChange,
}: EditListingDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    availableFrom: formatDateForInput(listing.availableFrom),
    availableTo: formatDateForInput(listing.availableTo),
    hourlyRate:
      typeof listing.hourlyRate === "number"
        ? listing.hourlyRate
        : parseFloat(listing.hourlyRate.toString()),
    workType: listing.workType,
    minDuration: listing.minDuration,
    status: listing.status,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        availableFrom: formatDateForInput(listing.availableFrom),
        availableTo: formatDateForInput(listing.availableTo),
        hourlyRate:
          typeof listing.hourlyRate === "number"
            ? listing.hourlyRate
            : parseFloat(listing.hourlyRate.toString()),
        workType: listing.workType,
        minDuration: listing.minDuration,
        status: listing.status,
      });
    }
  }, [open, listing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateListing(listing.id, {
      availableFrom: formData.availableFrom,
      availableTo: formData.availableTo || undefined,
      hourlyRate: formData.hourlyRate,
      workType: formData.workType as
        | "Full-time"
        | "Part-time"
        | "Contract"
        | "Flexible",
      minDuration: formData.minDuration,
      status: formData.status as "DRAFT" | "ACTIVE",
    });

    if (result.success) {
      toast.success("Listing updated");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update listing");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Listing</DialogTitle>
          <DialogDescription>
            Update listing details, availability, and pricing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Availability Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="availableFrom">Available From *</Label>
              <Input
                id="availableFrom"
                type="date"
                required
                value={formData.availableFrom}
                onChange={(e) =>
                  setFormData({ ...formData, availableFrom: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availableTo">Available Until</Label>
              <Input
                id="availableTo"
                type="date"
                value={formData.availableTo}
                onChange={(e) =>
                  setFormData({ ...formData, availableTo: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty if open-ended
              </p>
            </div>
          </div>

          {/* Rate and Duration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (€) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                min={1}
                value={formData.hourlyRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hourlyRate: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minDuration">Min Duration (weeks) *</Label>
              <Input
                id="minDuration"
                type="number"
                min={1}
                value={formData.minDuration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minDuration: parseInt(e.target.value) || 1,
                  })
                }
                required
              />
            </div>
          </div>

          {/* Work Type and Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workType">Work Type *</Label>
              <Select
                value={formData.workType}
                onValueChange={(v) => setFormData({ ...formData, workType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active (Visible)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
