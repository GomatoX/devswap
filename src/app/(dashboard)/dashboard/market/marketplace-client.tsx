"use client";

import { useState } from "react";
import Link from "next/link";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  Users,
  Clock,
  Building2,
  Calendar,
  User,
  X,
  Sparkles,
  Lock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type MarketplaceListing = {
  id: string;
  hourlyRate: number | { toString: () => string };
  currency: string;
  workType: string;
  availableFrom: Date | string;
  availableTo: Date | string | null;
  minDuration: number;
  developer: {
    pseudonym: string;
    title: string;
    level: string;
    bio: string | null;
    photoUrl?: string | null;
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
    };
  };
};

type Filters = {
  search: string;
  workType: string;
  level: string;
  minRate: string;
  maxRate: string;
};

const LEVEL_OPTIONS = ["Junior", "Mid", "Senior", "Lead", "Principal"];
const WORK_TYPE_OPTIONS = ["Full-time", "Part-time", "Contract", "Flexible"];

// Filter Panel Component - defined outside to avoid recreating on each render
function FilterPanel({
  filters,
  setFilters,
  hasActiveFilters,
  clearFilters,
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Work Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Work Type</Label>
        <div className="flex flex-wrap gap-2">
          {WORK_TYPE_OPTIONS.map((type) => (
            <button
              key={type}
              onClick={() =>
                setFilters({
                  ...filters,
                  workType: filters.workType === type ? "" : type,
                })
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                filters.workType === type
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Experience Level</Label>
        <div className="flex flex-wrap gap-2">
          {LEVEL_OPTIONS.map((level) => (
            <button
              key={level}
              onClick={() =>
                setFilters({
                  ...filters,
                  level: filters.level === level ? "" : level,
                })
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                filters.level === level
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Hourly Rate */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Hourly Rate (€)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minRate}
            onChange={(e) =>
              setFilters({ ...filters, minRate: e.target.value })
            }
            className="h-9"
          />
          <span className="flex items-center text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxRate}
            onChange={(e) =>
              setFilters({ ...filters, maxRate: e.target.value })
            }
            className="h-9"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Clear all filters
        </Button>
      )}
    </div>
  );
}

export function MarketplaceClient({
  initialListings,
  currentCompanyId,
}: {
  initialListings: MarketplaceListing[];
  currentCompanyId?: string;
}) {
  const [listings] = useState(initialListings);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    workType: "",
    level: "",
    minRate: "",
    maxRate: "",
  });

  // Client-side filtering for instant feedback
  const filteredListings = listings.filter((listing) => {
    const rate =
      typeof listing.hourlyRate === "number"
        ? listing.hourlyRate
        : parseFloat(listing.hourlyRate.toString());

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        listing.developer.pseudonym.toLowerCase().includes(searchLower) ||
        listing.developer.title.toLowerCase().includes(searchLower) ||
        listing.developer.skills.some((s) =>
          s.skill.name.toLowerCase().includes(searchLower),
        );
      if (!matchesSearch) return false;
    }

    // Work type filter
    if (filters.workType && listing.workType !== filters.workType) {
      return false;
    }

    // Level filter
    if (filters.level && listing.developer.level !== filters.level) {
      return false;
    }

    // Rate filters
    if (filters.minRate && rate < parseFloat(filters.minRate)) {
      return false;
    }
    if (filters.maxRate && rate > parseFloat(filters.maxRate)) {
      return false;
    }

    return true;
  });

  const clearFilters = () => {
    setFilters({
      search: "",
      workType: "",
      level: "",
      minRate: "",
      maxRate: "",
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.workType ||
    filters.level ||
    filters.minRate ||
    filters.maxRate;

  const activeFilterCount = [
    filters.workType,
    filters.level,
    filters.minRate,
    filters.maxRate,
  ].filter(Boolean).length;

  return (
    <div className="flex gap-8">
      {/* Desktop Sidebar Filters */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Filters</h2>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            hasActiveFilters={!!hasActiveFilters}
            clearFilters={clearFilters}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Search Bar with Mobile Filter Button */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search skills, titles, or names..."
              className="pl-10 h-11 bg-muted/50 border-0 focus-visible:ring-2"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>

          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden h-11 w-11"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterPanel
                  filters={filters}
                  setFilters={setFilters}
                  hasActiveFilters={!!hasActiveFilters}
                  clearFilters={clearFilters}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.workType && (
              <Badge
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => setFilters({ ...filters, workType: "" })}
              >
                {filters.workType}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {filters.level && (
              <Badge
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => setFilters({ ...filters, level: "" })}
              >
                {filters.level}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {(filters.minRate || filters.maxRate) && (
              <Badge
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                onClick={() =>
                  setFilters({ ...filters, minRate: "", maxRate: "" })
                }
              >
                {filters.minRate || "0"} - {filters.maxRate || "∞"} €/hr
                <X className="h-3 w-3" />
              </Badge>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {filteredListings.length}
            </span>{" "}
            {filteredListings.length === 1 ? "developer" : "developers"}{" "}
            available
          </p>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-4 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No matches found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                {hasActiveFilters
                  ? "Try adjusting your filters to discover more talent."
                  : "Be the first to list your developers on the marketplace!"}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Link href="/dashboard/bench">
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    List Your Team
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isOwnListing={listing.developer.company.id === currentCompanyId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCard({
  listing,
  isOwnListing,
}: {
  listing: MarketplaceListing;
  isOwnListing?: boolean;
}) {
  const rate =
    typeof listing.hourlyRate === "number"
      ? listing.hourlyRate
      : parseFloat(listing.hourlyRate.toString());

  const primarySkills = listing.developer.skills.filter((s) => s.isPrimary);
  const otherSkills = listing.developer.skills.filter((s) => !s.isPrimary);
  const availableFrom = new Date(listing.availableFrom);

  return (
    <Link href={`/dashboard/market/${listing.id}`} className="block group">
      <Card className="h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 border-border/50 hover:border-primary/30 overflow-hidden">
        {/* Gradient accent top bar */}
        <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />

        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative shrink-0">
              {listing.developer.photoUrl ? (
                <Image
                  src={listing.developer.photoUrl}
                  alt={listing.developer.pseudonym}
                  width={48}
                  height={48}
                  className="rounded-full object-cover ring-2 ring-background"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-background">
                  <User className="h-5 w-5 text-primary/70" />
                </div>
              )}
              {isOwnListing && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-background">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Name & Title */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">
                {listing.developer.pseudonym}
              </CardTitle>
              <CardDescription className="line-clamp-1">
                {listing.developer.title}
              </CardDescription>
            </div>

            {/* Price Badge */}
            <Badge className="shrink-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-sm">
              {formatCurrency(rate)}/hr
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Level & Work Type */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-normal">
              {listing.developer.level}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {listing.workType}
            </Badge>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5">
            {primarySkills.slice(0, 3).map((s) => (
              <span
                key={s.skill.name}
                className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-md"
              >
                {s.skill.name}
              </span>
            ))}
            {otherSkills.slice(0, 2).map((s) => (
              <span
                key={s.skill.name}
                className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md"
              >
                {s.skill.name}
              </span>
            ))}
            {listing.developer.skills.length > 5 && (
              <span className="px-2 py-0.5 text-xs text-muted-foreground">
                +{listing.developer.skills.length - 5}
              </span>
            )}
          </div>

          {/* Meta Info */}
          <div className="pt-3 border-t border-border/50 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              <span className="truncate">{listing.developer.company.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Available{" "}
                {availableFrom <= new Date()
                  ? "now"
                  : availableFrom.toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Min. {listing.minDuration} weeks</span>
            </div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Lock className="h-3.5 w-3.5" />
              <span>Contacts revealed after deal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
