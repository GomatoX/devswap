"use client";

import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateDeveloper } from "./actions";

type Developer = {
  id: string;
  realName: string;
  pseudonym: string;
  title: string;
  level: string;
  bio: string | null;
  photoUrl: string | null;
  cvUrl: string | null;
  skills: Array<{
    skill: { name: string };
    years: number;
    isPrimary: boolean;
  }>;
};

type EditDeveloperDialogProps = {
  developer: Developer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditDeveloperDialog({
  developer,
  open,
  onOpenChange,
}: EditDeveloperDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Compute initial form data based on developer prop
  const initialFormData = useMemo(
    () => ({
      realName: developer.realName,
      pseudonym: developer.pseudonym,
      title: developer.title,
      level: developer.level,
      bio: developer.bio || "",
      photoUrl: developer.photoUrl || "",
      cvUrl: developer.cvUrl || "",
    }),
    [developer],
  );

  const [formData, setFormData] = useState(initialFormData);

  // Reset form when dialog opens with new data
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setFormData({
        realName: developer.realName,
        pseudonym: developer.pseudonym,
        title: developer.title,
        level: developer.level,
        bio: developer.bio || "",
        photoUrl: developer.photoUrl || "",
        cvUrl: developer.cvUrl || "",
      });
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateDeveloper(developer.id, {
      realName: formData.realName,
      pseudonym: formData.pseudonym,
      title: formData.title,
      level: formData.level as
        | "Junior"
        | "Mid"
        | "Senior"
        | "Lead"
        | "Principal",
      bio: formData.bio || undefined,
      photoUrl: formData.photoUrl || undefined,
      cvUrl: formData.cvUrl || undefined,
    });

    if (result.success) {
      toast.success("Developer updated");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update developer");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Developer</DialogTitle>
          <DialogDescription>
            Update developer profile information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="realName">Real Name *</Label>
              <Input
                id="realName"
                value={formData.realName}
                onChange={(e) =>
                  setFormData({ ...formData, realName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pseudonym">Public Name *</Label>
              <Input
                id="pseudonym"
                value={formData.pseudonym}
                onChange={(e) =>
                  setFormData({ ...formData, pseudonym: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Senior Frontend Developer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Experience Level *</Label>
              <Select
                value={formData.level}
                onValueChange={(v) => setFormData({ ...formData, level: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junior">Junior (0-2 years)</SelectItem>
                  <SelectItem value="Mid">Mid (2-5 years)</SelectItem>
                  <SelectItem value="Senior">Senior (5-8 years)</SelectItem>
                  <SelectItem value="Lead">Lead (8+ years)</SelectItem>
                  <SelectItem value="Principal">
                    Principal (10+ years)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Tell us about this developer's experience and expertise..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="photoUrl">Photo URL</Label>
              <Input
                id="photoUrl"
                type="url"
                value={formData.photoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, photoUrl: e.target.value })
                }
                placeholder="https://example.com/photo.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Profile photo for marketplace listing
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvUrl">CV / Resume URL</Label>
              <Input
                id="cvUrl"
                type="url"
                value={formData.cvUrl}
                onChange={(e) =>
                  setFormData({ ...formData, cvUrl: e.target.value })
                }
                placeholder="https://example.com/cv.pdf"
              />
              <p className="text-xs text-muted-foreground">
                Link to downloadable CV/resume
              </p>
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
