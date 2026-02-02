import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getBillingInfo } from "./actions";
import { BillingClient } from "./billing-client";
import { checkSubscription } from "@/lib/subscription";
import { getTierConfig } from "@/lib/stripe";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function BillingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [billingResult, subscriptionStatus, tierConfig, settings] =
    await Promise.all([
      getBillingInfo(),
      checkSubscription(),
      getTierConfig(),
      getPlatformSettings(),
    ]);

  return (
    <BillingClient
      billing={
        billingResult.success && billingResult.data ? billingResult.data : null
      }
      subscriptionStatus={subscriptionStatus}
      tierConfig={tierConfig}
      currency={settings.currency}
    />
  );
}
