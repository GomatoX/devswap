"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { getDevelopers } from "./actions";
import { createListing } from "../market/actions";

const workTypes = ["Full-time", "Part-time", "Contract", "Flexible"] as const;

type Developer = {
  id: string;
  pseudonym: string;
  title: string;
  level: string;
};

export function AddListingDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [developers, setDevelopers] = useState<Developer[]>([]);

  const [formData, setFormData] = useState({
    developerId: "",
    availableFrom: "",
    availableTo: "",
    workType: "" as (typeof workTypes)[number] | "",
    hourlyRate: "",
    minDuration: "4",
  });

  // Fetch developers when dialog opens
  useEffect(() => {
    if (open) {
      getDevelopers().then((result) => {
        if (result.success && result.data) {
          setDevelopers(result.data);
        }
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.developerId ||
      !formData.workType ||
      !formData.availableFrom ||
      !formData.hourlyRate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    const result = await createListing({
      developerId: formData.developerId,
      availableFrom: formData.availableFrom,
      availableTo: formData.availableTo || undefined,
      workType: formData.workType,
      hourlyRate: parseFloat(formData.hourlyRate),
      minDuration: parseInt(formData.minDuration),
      status: "ACTIVE",
    });

    if (result.success) {
      toast.success("Listing created and published!");
      setOpen(false);
      setFormData({
        developerId: "",
        availableFrom: "",
        availableTo: "",
        workType: "",
        hourlyRate: "",
        minDuration: "4",
      });
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create listing");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Listing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Listing</DialogTitle>
          <DialogDescription>
            Publish a developer to the marketplace. Choose a developer and set
            availability details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="developer">Developer *</Label>
            <Select
              value={formData.developerId}
              onValueChange={(value) =>
                setFormData({ ...formData, developerId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a developer" />
              </SelectTrigger>
              <SelectContent>
                {developers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No developers available
                  </SelectItem>
                ) : (
                  developers.map((dev) => (
                    <SelectItem key={dev.id} value={dev.id}>
                      {dev.pseudonym} - {dev.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

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
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workType">Work Type *</Label>
              <Select
                value={formData.workType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    workType: value as typeof formData.workType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {workTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minDuration">Min Duration (weeks) *</Label>
              <Input
                id="minDuration"
                type="number"
                min="1"
                required
                value={formData.minDuration}
                onChange={(e) =>
                  setFormData({ ...formData, minDuration: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate (€) *</Label>
            <Input
              id="hourlyRate"
              type="number"
              min="1"
              placeholder="75"
              required
              value={formData.hourlyRate}
              onChange={(e) =>
                setFormData({ ...formData, hourlyRate: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              This rate will be visible to potential clients.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || developers.length === 0}>
              {loading ? "Creating..." : "Create & Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
