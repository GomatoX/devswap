"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { deleteListing, toggleListingStatus } from "../market/actions";
import { EditListingDialog } from "./edit-listing-dialog";

type Listing = {
  id: string;
  availableFrom: Date | string;
  availableTo?: Date | string | null;
  hourlyRate: number | { toString(): string };
  workType: string;
  minDuration: number;
  status: string;
  developer: {
    id: string;
    pseudonym: string;
    title: string;
    skills: Array<{ skill: { name: string }; isPrimary: boolean }>;
  };
};

export function ListingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const hourlyRate =
    typeof listing.hourlyRate === "number"
      ? listing.hourlyRate
      : parseFloat(listing.hourlyRate.toString());

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteListing(listing.id);

    if (result.success) {
      toast.success("Listing deleted");
      setDeleteOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete");
    }
    setLoading(false);
  };

  const handleToggleStatus = async () => {
    setLoading(true);
    const result = await toggleListingStatus(listing.id);

    if (result.success) {
      toast.success(
        listing.status === "ACTIVE"
          ? "Listing deactivated"
          : "Listing published",
      );
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update status");
    }
    setLoading(false);
  };

  const primarySkills =
    listing.developer.skills?.filter((s) => s.isPrimary) || [];

  return (
    <>
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                {listing.developer.title}
                <Badge
                  variant={
                    listing.status === "ACTIVE" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {listing.status === "ACTIVE" ? "Live" : "Draft"}
                </Badge>
              </CardTitle>
              <CardDescription>{listing.developer.pseudonym}</CardDescription>
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
                  onClick={handleToggleStatus}
                  disabled={loading}
                >
                  {listing.status === "ACTIVE" ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Publish
                    </>
                  )}
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
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Skills */}
          <div className="flex flex-wrap gap-1">
            {primarySkills.slice(0, 3).map((s) => (
              <Badge key={s.skill.name} variant="outline" className="text-xs">
                {s.skill.name}
              </Badge>
            ))}
          </div>

          {/* Rate and Details */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-primary font-medium">
              <DollarSign className="h-4 w-4" />
              {hourlyRate}/hr
            </div>
            <div className="text-muted-foreground text-xs">
              {listing.workType} · Min {listing.minDuration} weeks
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot
              be undone.
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

      {/* Edit Listing Dialog */}
      <EditListingDialog
        listing={listing}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
