"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createDeveloper, type CreateDeveloperInput } from "./actions";
import { EXPERIENCE_LEVELS, POPULAR_SKILLS } from "./constants";

type SkillInput = {
  name: string;
  years: number;
  isPrimary: boolean;
};

export function AddDeveloperDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<SkillInput[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const [formData, setFormData] = useState({
    realName: "",
    email: "",
    pseudonym: "",
    title: "",
    level: "" as (typeof EXPERIENCE_LEVELS)[number] | "",
    bio: "",
    internalRate: "",
  });

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.find((s) => s.name.toLowerCase() === newSkill.toLowerCase())) {
      toast.error("Skill already added");
      return;
    }
    setSkills([
      ...skills,
      { name: newSkill.trim(), years: 1, isPrimary: skills.length === 0 },
    ]);
    setNewSkill("");
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkills(skills.filter((s) => s.name !== skillName));
  };

  const handleSetPrimary = (skillName: string) => {
    setSkills(skills.map((s) => ({ ...s, isPrimary: s.name === skillName })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.level) {
      toast.error("Please select a level");
      return;
    }

    setLoading(true);

    const input: CreateDeveloperInput = {
      realName: formData.realName,
      email: formData.email || undefined,
      pseudonym: formData.pseudonym,
      title: formData.title,
      level: formData.level,
      bio: formData.bio || undefined,
      internalRate: formData.internalRate
        ? parseFloat(formData.internalRate)
        : undefined,
      skills: skills.length > 0 ? skills : undefined,
    };

    const result = await createDeveloper(input);

    if (result.success) {
      toast.success("Developer added successfully!");
      setOpen(false);
      setFormData({
        realName: "",
        email: "",
        pseudonym: "",
        title: "",
        level: "",
        bio: "",
        internalRate: "",
      });
      setSkills([]);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to add developer");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Developer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Developer</DialogTitle>
          <DialogDescription>
            Add a new developer to your bench. Their public profile will be
            visible in the marketplace when you create a listing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Internal Info Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">
              Internal Information (Private)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="realName">Real Name *</Label>
                <Input
                  id="realName"
                  placeholder="John Smith"
                  required
                  value={formData.realName}
                  onChange={(e) =>
                    setFormData({ ...formData, realName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="internalRate">Internal Rate (€/hour)</Label>
              <Input
                id="internalRate"
                type="number"
                placeholder="45"
                value={formData.internalRate}
                onChange={(e) =>
                  setFormData({ ...formData, internalRate: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Your internal cost. Not shown publicly.
              </p>
            </div>
          </div>

          {/* Public Profile Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-sm text-muted-foreground">
              Public Profile
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pseudonym">Display Name *</Label>
                <Input
                  id="pseudonym"
                  placeholder="John S."
                  required
                  value={formData.pseudonym}
                  onChange={(e) =>
                    setFormData({ ...formData, pseudonym: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Senior Full Stack Developer"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Experience Level *</Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    level: value as typeof formData.level,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Brief description of experience and expertise..."
                rows={3}
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-sm text-muted-foreground">
              Skills
            </h3>

            {/* Added Skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill.name}
                    variant={skill.isPrimary ? "default" : "secondary"}
                    className="pl-2 pr-1 gap-1"
                  >
                    <span
                      className="cursor-pointer"
                      onClick={() => handleSetPrimary(skill.name)}
                    >
                      {skill.name} ({skill.years}y)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.name)}
                      className="ml-1 hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Skill Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddSkill}>
                Add
              </Button>
            </div>

            {/* Popular Skills */}
            <div className="flex flex-wrap gap-1">
              {POPULAR_SKILLS.filter(
                (s) => !skills.find((added) => added.name === s),
              )
                .slice(0, 8)
                .map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() =>
                      setSkills([
                        ...skills,
                        {
                          name: skill,
                          years: 1,
                          isPrimary: skills.length === 0,
                        },
                      ])
                    }
                  >
                    + {skill}
                  </Badge>
                ))}
            </div>
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
              {loading ? "Adding..." : "Add Developer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
