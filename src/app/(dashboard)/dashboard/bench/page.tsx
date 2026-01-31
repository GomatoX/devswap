import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  ExternalLink,
  Trash2,
  AlertCircle,
  Settings,
} from "lucide-react";
import { getDevelopers } from "./actions";
import { getListings } from "../market/actions";
import { isCompanyProfileComplete } from "../settings/actions";
import { AddDeveloperButton } from "./developer-form-dialog";
import { AddListingDialog } from "./add-listing-dialog";
import { DeveloperCard } from "./developer-card";
import { ListingCard } from "./listing-card";

export default async function BenchPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [developersResult, listingsResult, profileComplete] = await Promise.all(
    [getDevelopers(), getListings(), isCompanyProfileComplete()],
  );
  const developers = developersResult.success ? developersResult.data : [];
  const listings = listingsResult.success ? listingsResult.data : [];

  return (
    <div className="space-y-8">
      {/* Profile Incomplete Warning */}
      {!profileComplete && (
        <Card className="border-orange-500/50 bg-orange-500/10">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium text-orange-500">
                  Complete your company profile first
                </p>
                <p className="text-sm text-muted-foreground">
                  You must complete your company profile before adding
                  developers.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4 mr-2" />
                Complete Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bench</h1>
          <p className="text-muted-foreground">
            Manage your available developer resources
          </p>
        </div>
        {profileComplete && (
          <div className="flex gap-2">
            <AddListingDialog />
            <AddDeveloperButton />
          </div>
        )}
      </div>

      {/* Developers Grid */}
      {!developers || developers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No developers yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              {profileComplete
                ? "Add your first developer to start listing resources on the marketplace."
                : "Complete your company profile first to add developers."}
            </p>
            {profileComplete ? (
              <AddDeveloperButton />
            ) : (
              <Button asChild>
                <Link href="/dashboard/settings">Complete Company Profile</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {developers.map((dev) => (
            <DeveloperCard key={dev.id} developer={dev} />
          ))}
        </div>
      )}

      {/* Listings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Your Listings</h2>
            <p className="text-sm text-muted-foreground">
              Active listings visible in the marketplace
            </p>
          </div>
        </div>

        {!listings || listings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No listings yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                Create a listing to make your developers visible in the
                marketplace.
              </p>
              {developers && developers.length > 0 ? (
                <AddListingDialog />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Add a developer first to create listings
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            💡 Tips for Successful Listings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Add detailed skill descriptions and experience levels</p>
          <p>• Keep availability status up to date</p>
          <p>• Add a professional photo or avatar</p>
          <p>• Set competitive hourly rates based on market research</p>
        </CardContent>
      </Card>
    </div>
  );
}
