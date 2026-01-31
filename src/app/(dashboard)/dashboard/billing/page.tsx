import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getBillingInfo } from "./actions";
import { BillingClient } from "./billing-client";
import { checkSubscription } from "@/lib/subscription";

export default async function BillingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [billingResult, subscriptionStatus] = await Promise.all([
    getBillingInfo(),
    checkSubscription(),
  ]);

  return (
    <BillingClient
      billing={
        billingResult.success && billingResult.data ? billingResult.data : null
      }
      subscriptionStatus={subscriptionStatus}
    />
  );
}
