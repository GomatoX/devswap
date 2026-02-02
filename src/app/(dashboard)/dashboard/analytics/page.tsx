import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAnalyticsData } from "./actions";
import { AnalyticsClient } from "./analytics-client";
import { SubscriptionGate } from "@/components/subscription-gate";
import { checkSubscription } from "@/lib/subscription";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.isAdmin === true;
  const subscription = await checkSubscription();
  const settings = await getPlatformSettings();

  const result = await getAnalyticsData();

  if (!result.success || !result.data) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <SubscriptionGate
      isActive={subscription.isActive}
      tier={subscription.tier}
      isAdmin={isAdmin}
      buyerMonthlyPrice={settings.buyerMonthlyPrice}
      buyerFeatures={settings.buyerFeatures}
    >
      <AnalyticsClient data={result.data} />
    </SubscriptionGate>
  );
}
