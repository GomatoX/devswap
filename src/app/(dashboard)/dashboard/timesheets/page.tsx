import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTimesheets } from "./actions";
import { TimesheetsClient } from "./timesheets-client";
import { SubscriptionGate } from "@/components/subscription-gate";
import { checkSubscription } from "@/lib/subscription";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function TimesheetsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.isAdmin === true;
  const subscription = await checkSubscription();
  const settings = await getPlatformSettings();

  const result = await getTimesheets();

  if (!result.success) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load timesheets</p>
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
      <TimesheetsClient
        timesheets={result.data || []}
        currentCompanyId={result.companyId || ""}
      />
    </SubscriptionGate>
  );
}
