"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreVertical, Edit, Trash2, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { deleteDeveloper } from "./actions";
import { createListing } from "../market/actions";
import { DeveloperFormDialog } from "./developer-form-dialog";

const workTypes = ["Full-time", "Part-time", "Contract", "Flexible"] as const;

type Developer = {
  id: string;
  realName: string;
  pseudonym: string;
  title: string;
  level: string;
  bio: string | null;
  photoUrl: string | null;
  cvUrl: string | null;
  country: string | null;
  languages: string[];
  skills: Array<{
    skill: { name: string };
    years: number;
    isPrimary: boolean;
  }>;
  listings: Array<{ id: string; status: string }>;
};

export function DeveloperCard({ developer }: { developer: Developer }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createListingOpen, setCreateListingOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create Listing Form State
  const [listingForm, setListingForm] = useState({
    availableFrom: "",
    availableTo: "",
    workType: "" as (typeof workTypes)[number] | "",
    hourlyRate: "",
    minDuration: "4",
  });

  const activeListings =
    developer.listings?.filter((l) => l.status === "ACTIVE") || [];
  const primarySkills = developer.skills?.filter((s) => s.isPrimary) || [];
  const otherSkills = developer.skills?.filter((s) => !s.isPrimary) || [];

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteDeveloper(developer.id);

    if (result.success) {
      toast.success("Developer removed successfully");
      setDeleteOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to remove developer");
    }
    setLoading(false);
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !listingForm.workType ||
      !listingForm.availableFrom ||
      !listingForm.hourlyRate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    const result = await createListing({
      developerId: developer.id,
      availableFrom: listingForm.availableFrom,
      availableTo: listingForm.availableTo || undefined,
      workType: listingForm.workType,
      hourlyRate: parseFloat(listingForm.hourlyRate),
      minDuration: parseInt(listingForm.minDuration),
      status: "ACTIVE",
    });

    if (result.success) {
      toast.success("Listing created and published!");
      setCreateListingOpen(false);
      setListingForm({
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
    <>
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Photo */}
            <div className="shrink-0">
              {developer.photoUrl ? (
                <Image
                  src={developer.photoUrl}
                  alt={developer.pseudonym}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {developer.pseudonym}
                    <Badge variant="outline" className="text-xs">
                      {developer.level}
                    </Badge>
                    {developer.cvUrl && (
                      <Badge variant="secondary" className="text-xs">
                        CV
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{developer.title}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setCreateListingOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Listing
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Skills */}
          <div className="flex flex-wrap gap-1">
            {primarySkills.map((s) => (
              <Badge key={s.skill.name} variant="default" className="text-xs">
                {s.skill.name}
              </Badge>
            ))}
            {otherSkills.slice(0, 3).map((s) => (
              <Badge key={s.skill.name} variant="secondary" className="text-xs">
                {s.skill.name}
              </Badge>
            ))}
            {otherSkills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{otherSkills.length - 3}
              </Badge>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Listings</span>
            <Badge
              variant={activeListings.length > 0 ? "default" : "secondary"}
            >
              {activeListings.length}
            </Badge>
          </div>

          {/* Internal Info */}
          <div className="text-xs text-muted-foreground border-t pt-3">
            <span className="font-medium">Internal:</span> {developer.realName}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Developer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {developer.pseudonym} from your
              bench? This will also delete all associated listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Developer Dialog */}
      <DeveloperFormDialog
        developer={developer}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Create Listing Dialog */}
      <Dialog open={createListingOpen} onOpenChange={setCreateListingOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Listing for {developer.pseudonym}</DialogTitle>
            <DialogDescription>
              Publish {developer.pseudonym} to the marketplace with availability
              details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateListing} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="availableFrom">Available From *</Label>
                <Input
                  id="availableFrom"
                  type="date"
                  required
                  value={listingForm.availableFrom}
                  onChange={(e) =>
                    setListingForm({
                      ...listingForm,
                      availableFrom: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableTo">Available Until</Label>
                <Input
                  id="availableTo"
                  type="date"
                  value={listingForm.availableTo}
                  onChange={(e) =>
                    setListingForm({
                      ...listingForm,
                      availableTo: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workType">Work Type *</Label>
                <Select
                  value={listingForm.workType}
                  onValueChange={(value) =>
                    setListingForm({
                      ...listingForm,
                      workType: value as typeof listingForm.workType,
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
                  value={listingForm.minDuration}
                  onChange={(e) =>
                    setListingForm({
                      ...listingForm,
                      minDuration: e.target.value,
                    })
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
                value={listingForm.hourlyRate}
                onChange={(e) =>
                  setListingForm({ ...listingForm, hourlyRate: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateListingOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create & Publish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
