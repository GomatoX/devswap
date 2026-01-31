"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

function DeveloperCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {/* Cover area */}
        <Skeleton className="h-20 w-full" />
        {/* Avatar */}
        <div className="absolute -bottom-6 left-4">
          <Skeleton className="h-16 w-16 rounded-full border-4 border-background" />
        </div>
      </div>

      <CardContent className="pt-10 pb-6">
        <div className="space-y-3">
          <div>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>

          {/* Rate & Info */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Action */}
        <div className="mt-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketplaceLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Developer Marketplace
        </h1>
        <p className="text-muted-foreground">
          Find skilled developers available for engagement
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search developers..."
            className="pl-10"
            disabled
          />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        <Skeleton className="h-4 w-40 inline-block" />
      </div>

      {/* Developer Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DeveloperCardSkeleton />
        <DeveloperCardSkeleton />
        <DeveloperCardSkeleton />
        <DeveloperCardSkeleton />
        <DeveloperCardSkeleton />
        <DeveloperCardSkeleton />
        <DeveloperCardSkeleton />
        <DeveloperCardSkeleton />
      </div>
    </div>
  );
}
