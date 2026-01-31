"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileUploadButton } from "@/components/file-upload";
import { Plus, X, User, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createDeveloper, updateDeveloper } from "./actions";

const popularSkills = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "Java",
  "Go",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "Docker",
  "Kubernetes",
  "Next.js",
  "Vue.js",
  "Angular",
  "GraphQL",
  "REST API",
];

type SkillInput = {
  name: string;
  years: number;
  isPrimary: boolean;
};

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

type DeveloperFormDialogProps = {
  developer?: Developer;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DeveloperFormDialog({
  developer,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DeveloperFormDialogProps) {
  const router = useRouter();
  const isEdit = !!developer;

  // Handle both controlled and uncontrolled modes
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    realName: developer?.realName || "",
    pseudonym: developer?.pseudonym || "",
    title: developer?.title || "",
    level: developer?.level || "",
    bio: developer?.bio || "",
    photoUrl: developer?.photoUrl || "",
    cvUrl: developer?.cvUrl || "",
  });
  const [skills, setSkills] = useState<SkillInput[]>(
    developer?.skills.map((s) => ({
      name: s.skill.name,
      years: s.years,
      isPrimary: s.isPrimary,
    })) || [],
  );
  const [newSkill, setNewSkill] = useState({ name: "", years: 1 });

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && developer) {
      setFormData({
        realName: developer.realName,
        pseudonym: developer.pseudonym,
        title: developer.title,
        level: developer.level,
        bio: developer.bio || "",
        photoUrl: developer.photoUrl || "",
        cvUrl: developer.cvUrl || "",
      });
      setSkills(
        developer.skills.map((s) => ({
          name: s.skill.name,
          years: s.years,
          isPrimary: s.isPrimary,
        })),
      );
    } else if (newOpen && !developer) {
      setFormData({
        realName: "",
        pseudonym: "",
        title: "",
        level: "",
        bio: "",
        photoUrl: "",
        cvUrl: "",
      });
      setSkills([]);
    }
    setOpen(newOpen);
  };

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;
    if (
      skills.some((s) => s.name.toLowerCase() === newSkill.name.toLowerCase())
    ) {
      toast.error("Skill already added");
      return;
    }
    setSkills([...skills, { ...newSkill, isPrimary: skills.length === 0 }]);
    setNewSkill({ name: "", years: 1 });
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkills(skills.filter((s) => s.name !== skillName));
  };

  const handleSetPrimary = (skillName: string) => {
    setSkills(skills.map((s) => ({ ...s, isPrimary: s.name === skillName })));
  };

  const handleTogglePrimary = (skillName: string) => {
    setSkills(
      skills.map((s) =>
        s.name === skillName ? { ...s, isPrimary: !s.isPrimary } : s,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const input = {
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
      skills: skills.length > 0 ? skills : undefined,
    };

    const result = isEdit
      ? await updateDeveloper(developer.id, input)
      : await createDeveloper(input);

    if (result.success) {
      toast.success(isEdit ? "Developer updated!" : "Developer added!");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(
        result.error || `Failed to ${isEdit ? "update" : "add"} developer`,
      );
    }
    setLoading(false);
  };

  const dialogContent = (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Developer" : "Add Developer"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update developer profile information."
            : "Add a new developer to your bench. They can be listed on the marketplace."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <div className="space-y-2">
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4">
            {formData.photoUrl ? (
              <div className="relative">
                <Image
                  src={formData.photoUrl}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, photoUrl: "" })}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <FileUploadButton
              endpoint="developerPhoto"
              label="Upload Photo"
              onUploadComplete={(url) => {
                setFormData({ ...formData, photoUrl: url });
                toast.success("Photo uploaded!");
              }}
              onUploadError={(error) => {
                toast.error(`Upload failed: ${error.message}`);
              }}
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="realName">Real Name *</Label>
            <Input
              id="realName"
              value={formData.realName}
              onChange={(e) =>
                setFormData({ ...formData, realName: e.target.value })
              }
              placeholder="John Doe"
              required
            />
            <p className="text-xs text-muted-foreground">
              Internal only, not shown publicly
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pseudonym">Public Name *</Label>
            <Input
              id="pseudonym"
              value={formData.pseudonym}
              onChange={(e) =>
                setFormData({ ...formData, pseudonym: e.target.value })
              }
              placeholder="John D."
              required
            />
            <p className="text-xs text-muted-foreground">
              Shown on marketplace listings
            </p>
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
                <SelectItem value="Principal">Principal (10+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Brief description of experience and expertise..."
            rows={3}
          />
        </div>

        {/* CV Upload */}
        <div className="space-y-2">
          <Label>CV / Resume</Label>
          <div className="flex items-center gap-4">
            {formData.cvUrl ? (
              <div className="flex items-center gap-2 p-2 border rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">CV uploaded</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, cvUrl: "" })}
                  className="p-1 hover:bg-muted rounded"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ) : (
              <FileUploadButton
                endpoint="developerCV"
                label="Upload CV"
                onUploadComplete={(url) => {
                  setFormData({ ...formData, cvUrl: url });
                  toast.success("CV uploaded!");
                }}
                onUploadError={(error) => {
                  toast.error(`Upload failed: ${error.message}`);
                }}
              />
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <Label>Skills & Technologies</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={newSkill.name}
                onChange={(e) =>
                  setNewSkill({ ...newSkill, name: e.target.value })
                }
                placeholder="Type skill name (e.g., React, Python)..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                list="skill-suggestions"
              />
              <datalist id="skill-suggestions">
                {popularSkills
                  .filter(
                    (s) =>
                      !skills.some(
                        (sk) => sk.name.toLowerCase() === s.toLowerCase(),
                      ),
                  )
                  .map((skill) => (
                    <option key={skill} value={skill} />
                  ))}
              </datalist>
            </div>
            <Input
              type="number"
              min="0"
              max="30"
              className="w-24"
              placeholder="Years"
              value={newSkill.years}
              onChange={(e) =>
                setNewSkill({
                  ...newSkill,
                  years: parseInt(e.target.value) || 0,
                })
              }
            />
            <Button type="button" variant="outline" onClick={handleAddSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {skills.length > 0 && (
            <div className="space-y-2 pt-2">
              {skills.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleTogglePrimary(skill.name)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        skill.isPrimary
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30 hover:border-primary/50"
                      }`}
                    >
                      {skill.isPrimary && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    <span className="font-medium">{skill.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {skill.years} {skill.years === 1 ? "year" : "years"}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill.name)}
                    className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Check the box to mark skills as "Core Technologies" (highlighted on
            profile).
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
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Developer"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {dialogContent}
    </Dialog>
  );
}

// Convenience component for adding new developers
export function AddDeveloperButton() {
  return (
    <DeveloperFormDialog
      trigger={
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Developer
        </Button>
      }
    />
  );
}
