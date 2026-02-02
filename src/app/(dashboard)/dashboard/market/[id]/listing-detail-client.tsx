"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Download,
  FileText,
  Mail,
  User,
  Sparkles,
  CheckCircle2,
  Briefcase,
  Star,
  Lock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createRequest } from "../../requests/actions";
import { toast } from "sonner";
import { addWeeks, format } from "date-fns";

type ListingDetailProps = {
  listing: {
    id: string;
    hourlyRate: { toString: () => string } | number;
    currency: string;
    workType: string;
    availableFrom: Date | string;
    availableTo: Date | string | null;
    minDuration: number;
    status: string;
    developer: {
      id: string;
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
      company: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
        status: string;
        description: string | null;
      };
    };
  };
  isOwnListing?: boolean;
};

export function ListingDetailClient({
  listing,
  isOwnListing,
}: ListingDetailProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addWeeks(new Date(), listing.minDuration), "yyyy-MM-dd"),
    message: "",
  });

  const rate =
    typeof listing.hourlyRate === "number"
      ? listing.hourlyRate
      : parseFloat(listing.hourlyRate.toString());

  const primarySkills = listing.developer.skills.filter((s) => s.isPrimary);
  const otherSkills = listing.developer.skills.filter((s) => !s.isPrimary);
  const totalYearsExperience = Math.max(
    ...listing.developer.skills.map((s) => s.years),
    0,
  );

  const availableFrom = new Date(listing.availableFrom);
  const availableTo = listing.availableTo
    ? new Date(listing.availableTo)
    : null;
  const isAvailableNow = availableFrom <= new Date();

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim() || formData.message.length < 10) {
      toast.error("Please provide a message (min 10 characters)");
      return;
    }

    setLoading(true);
    const result = await createRequest({
      listingId: listing.id,
      startDate: formData.startDate,
      endDate: formData.endDate,
      message: formData.message,
    });

    if (result.success) {
      toast.success("Engagement request sent!");
      setDialogOpen(false);
      router.push("/dashboard/requests");
    } else {
      toast.error(result.error || "Failed to send request");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/dashboard/market">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/50" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 20 0 L 0 0 0 20" fill="none" stroke="white" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E")',
          }}
        />

        <div className="relative px-8 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl shadow-2xl overflow-hidden border-4 border-white/20">
                {listing.developer.photoUrl ? (
                  <Image
                    src={listing.developer.photoUrl}
                    alt={listing.developer.pseudonym}
                    fill
                    sizes="(max-width: 768px) 128px, 160px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                    <User className="h-16 w-16 text-white/50" />
                  </div>
                )}
              </div>
              {isAvailableNow && (
                <div className="absolute -bottom-2 -right-2 flex items-center gap-1 bg-green-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Available
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3 text-white">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold">
                  {listing.developer.pseudonym}
                </h1>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  {listing.developer.level}
                </Badge>
                {isOwnListing && (
                  <Badge className="bg-blue-500/80 text-white border-0 gap-1">
                    <Sparkles className="h-3 w-3" />
                    Your Listing
                  </Badge>
                )}
              </div>
              <p className="text-xl text-white/90">{listing.developer.title}</p>
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  <span>{listing.workType}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>Min. {listing.minDuration} weeks</span>
                </div>
                {totalYearsExperience > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4" />
                    <span>{totalYearsExperience}+ years experience</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price Badge */}
            <div className="md:text-right">
              <div className="inline-flex flex-col items-end bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
                <span className="text-white/70 text-sm">Hourly Rate</span>
                <span className="text-3xl font-bold text-white">
                  {formatCurrency(rate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          {listing.developer.bio && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                About
              </h2>
              <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {listing.developer.bio}
                </p>
              </div>
            </section>
          )}

          {/* Skills Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Skills & Expertise
            </h2>

            <div className="space-y-6">
              {/* Primary Skills */}
              {primarySkills.length > 0 && (
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
                  <h3 className="text-sm font-medium text-primary mb-4 uppercase tracking-wide">
                    Core Technologies
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {primarySkills.map((s) => (
                      <div
                        key={s.skill.name}
                        className="flex items-center justify-between bg-background rounded-lg px-4 py-3 shadow-sm border border-border/50"
                      >
                        <span className="font-medium">{s.skill.name}</span>
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {s.years}y
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Skills */}
              {otherSkills.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                    Additional Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {otherSkills.map((s) => (
                      <Badge
                        key={s.skill.name}
                        variant="secondary"
                        className="px-3 py-1.5 text-sm font-normal"
                      >
                        {s.skill.name}
                        <span className="ml-1.5 text-muted-foreground">
                          {s.years}y
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* CV Download */}
          {listing.developer.cvUrl && (
            <section>
              <div className="flex items-center justify-between bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-6 border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Resume / CV Available</p>
                    <p className="text-sm text-muted-foreground">
                      Download to view complete work history
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="gap-2">
                  <a
                    href={listing.developer.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Availability Card */}
          <div className="bg-background rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-border/50">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Availability
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Available From
                </span>
                <span className="font-medium flex items-center gap-1.5">
                  {isAvailableNow ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Now</span>
                    </>
                  ) : (
                    availableFrom.toLocaleDateString()
                  )}
                </span>
              </div>
              {availableTo && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Available Until
                  </span>
                  <span className="font-medium">
                    {availableTo.toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Min. Duration
                </span>
                <span className="font-medium">{listing.minDuration} weeks</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Work Type</span>
                <Badge variant="outline">{listing.workType}</Badge>
              </div>

              <div className="pt-4 mt-4 border-t border-border/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(rate)}
                  </span>
                </div>

                {!isOwnListing ? (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Mail className="h-4 w-4" />
                    Request Engagement
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/bench">Edit Listing</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Company Card */}
          <div className="bg-background rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-muted/80 to-muted/40 px-6 py-4 border-b border-border/50">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {isOwnListing ? "Your Company" : "Vendor"}
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {isOwnListing ? (
                  // Owner sees full company info
                  <>
                    {listing.developer.company.logoUrl ? (
                      <Image
                        src={listing.developer.company.logoUrl}
                        alt={listing.developer.company.name}
                        width={48}
                        height={48}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">
                        {listing.developer.company.name}
                      </p>
                      <Badge
                        variant={
                          listing.developer.company.status === "ACTIVE"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs mt-1"
                      >
                        {listing.developer.company.status === "ACTIVE" ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          "Pending"
                        )}
                      </Badge>
                    </div>
                  </>
                ) : (
                  // Anonymous view for non-owners
                  <>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Verified Vendor</p>
                      <Badge variant="default" className="text-xs mt-1">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Platform Verified
                      </Badge>
                    </div>
                  </>
                )}
              </div>

              {isOwnListing &&
                listing.developer.company.description &&
                listing.developer.company.description !==
                  listing.developer.company.name && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {listing.developer.company.description}
                  </p>
                )}

              {!isOwnListing && (
                <p className="text-sm text-muted-foreground">
                  Company details will be revealed after the engagement is
                  finalized.
                </p>
              )}
            </div>
          </div>

          {/* Locked Contacts Notice */}
          {!isOwnListing && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Contacts are locked
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                      Direct contact information will be revealed after the
                      engagement is finalized and the matchmaking fee is paid.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Engagement Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Engagement</DialogTitle>
            <DialogDescription>
              Send an engagement request for {listing.developer.pseudonym}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  min={format(new Date(), "yyyy-MM-dd")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  min={formData.startDate}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Introduce your project and explain what you're looking for..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters
              </p>
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="font-medium">{formatCurrency(rate)}/hr</span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
