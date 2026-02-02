import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getRequests, getRequestCounts } from "./actions";
import { RequestsClient } from "./requests-client";
import { SubscriptionGate } from "@/components/subscription-gate";
import { checkSubscription } from "@/lib/subscription";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function RequestsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.isAdmin === true;
  const subscription = await checkSubscription();
  const settings = await getPlatformSettings();

  const [requestsResult, countsResult] = await Promise.all([
    getRequests(),
    getRequestCounts(),
  ]);

  const requests = requestsResult.success ? requestsResult.data : [];
  const counts = countsResult.success
    ? countsResult.data
    : { all: 0, pending: 0, active: 0, completed: 0 };

  return (
    <SubscriptionGate
      isActive={subscription.isActive}
      tier={subscription.tier}
      isAdmin={isAdmin}
      buyerMonthlyPrice={settings.buyerMonthlyPrice}
      buyerFeatures={settings.buyerFeatures}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">
            Manage your engagement requests and ongoing contracts
          </p>
        </div>

        <RequestsClient initialRequests={requests ?? []} counts={counts!} />
      </div>
    </SubscriptionGate>
  );
}
