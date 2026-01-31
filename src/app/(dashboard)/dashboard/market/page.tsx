import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMarketplaceListings } from "./actions";
import { MarketplaceClient } from "./marketplace-client";

export default async function MarketplacePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getMarketplaceListings();
  const listings = result.success ? result.data : [];
  const currentCompanyId = result.success ? result.currentCompanyId : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground">
          Find available IT resources from verified companies
        </p>
      </div>

      <MarketplaceClient
        initialListings={listings ?? []}
        currentCompanyId={currentCompanyId}
      />
    </div>
  );
}
