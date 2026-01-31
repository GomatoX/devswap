"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, CreditCard, Loader2, Zap, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
} from "./actions";
import { TIER_CONFIG } from "@/lib/stripe";
import { type SubscriptionCheck } from "@/lib/subscription";

type BillingData = {
  tier: string;
  stripeCustomerId: string | null;
  subscriptionEndsAt: Date | string | null;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: Date | string;
    cancelAtPeriodEnd: boolean;
  } | null;
} | null;

export function BillingClient({
  billing,
  subscriptionStatus,
}: {
  billing: BillingData;
  subscriptionStatus: SubscriptionCheck;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Show success/cancel messages from Stripe redirect
  if (searchParams.get("success")) {
    toast.success("Subscription activated!");
    router.replace("/dashboard/billing");
  }
  if (searchParams.get("canceled")) {
    toast.info("Checkout canceled");
    router.replace("/dashboard/billing");
  }

  const handleUpgrade = async (tier: "BUYER" | "VENDOR") => {
    setLoading(tier);
    const result = await createCheckoutSession(
      tier,
      yearly ? "yearly" : "monthly",
    );
    if (result.success && result.data?.url) {
      window.location.href = result.data.url;
    } else {
      toast.error(result.error || "Failed to start checkout");
      setLoading(null);
    }
  };

  const handleManage = async () => {
    setLoading("manage");
    const result = await createPortalSession();
    if (result.success && result.data?.url) {
      window.location.href = result.data.url;
    } else {
      toast.error(result.error || "Failed to open portal");
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    setLoading("cancel");
    const result = await cancelSubscription();
    if (result.success) {
      toast.success("Subscription will cancel at period end");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to cancel");
    }
    setLoading(null);
  };

  const currentTier = billing?.tier || "FREE";
  const hasSubscription = !!billing?.subscription;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

      {/* Beta Mode Banner */}
      {subscriptionStatus.isBetaMode && (
        <Card className="border-violet-500/50 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">Beta Access Active</h3>
                  <Badge className="bg-violet-500">FREE</Badge>
                </div>
                <p className="text-muted-foreground">
                  You have full access to all features during our beta period!
                  No payment required. We&apos;ll notify you before the beta
                  ends.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Founding Member Badge */}
      {subscriptionStatus.isFoundingMember && (
        <Card className="border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Crown className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">Founding Member</h3>
                  <Badge className="bg-amber-500">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Lifetime Free
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Thank you for being one of our first members! You have
                  lifetime free access to all premium features.
                  {subscriptionStatus.foundingDealsRemaining > 0 && (
                    <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">
                      🎁 {subscriptionStatus.foundingDealsRemaining} discounted
                      matchmaking deals remaining
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      {hasSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {TIER_CONFIG[currentTier as keyof typeof TIER_CONFIG]
                      ?.name || currentTier}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {billing?.subscription?.cancelAtPeriodEnd
                      ? "Cancels"
                      : "Renews"}{" "}
                    on{" "}
                    {format(
                      new Date(
                        billing?.subscription?.currentPeriodEnd || new Date(),
                      ),
                      "MMM d, yyyy",
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManage}
                  disabled={!!loading}
                >
                  {loading === "manage" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Manage"
                  )}
                </Button>
                {!billing?.subscription?.cancelAtPeriodEnd && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={!!loading}
                    className="text-red-600 hover:text-red-700"
                  >
                    {loading === "cancel" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Cancel"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Label
          htmlFor="billing-toggle"
          className={!yearly ? "font-semibold" : ""}
        >
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={yearly}
          onCheckedChange={setYearly}
        />
        <Label
          htmlFor="billing-toggle"
          className={yearly ? "font-semibold" : ""}
        >
          Yearly
          <Badge
            variant="secondary"
            className="ml-2 bg-green-500/10 text-green-600"
          >
            Save 17%
          </Badge>
        </Label>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Free Tier */}
        <Card className={currentTier === "FREE" ? "ring-2 ring-primary" : ""}>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>For browsing and exploration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">$0</div>
            <ul className="space-y-2">
              {TIER_CONFIG.FREE.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              {currentTier === "FREE" ? "Current Plan" : "Included"}
            </Button>
          </CardFooter>
        </Card>

        {/* Buyer Tier */}
        <Card className={currentTier === "BUYER" ? "ring-2 ring-primary" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Buyer</CardTitle>
              <Badge>Popular</Badge>
            </div>
            <CardDescription>For companies hiring talent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">
              $
              {yearly
                ? Math.round(TIER_CONFIG.BUYER.price.yearly / 12)
                : TIER_CONFIG.BUYER.price.monthly}
              <span className="text-base font-normal text-muted-foreground">
                /mo
              </span>
            </div>
            <ul className="space-y-2">
              {TIER_CONFIG.BUYER.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={
                currentTier === "BUYER" || currentTier === "VENDOR" || !!loading
              }
              onClick={() => handleUpgrade("BUYER")}
            >
              {loading === "BUYER" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : currentTier === "BUYER" ? (
                "Current Plan"
              ) : currentTier === "VENDOR" ? (
                "Included"
              ) : (
                "Upgrade"
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Vendor Tier */}
        <Card className={currentTier === "VENDOR" ? "ring-2 ring-primary" : ""}>
          <CardHeader>
            <CardTitle>Vendor</CardTitle>
            <CardDescription>For companies selling talent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">
              $
              {yearly
                ? Math.round(TIER_CONFIG.VENDOR.price.yearly / 12)
                : TIER_CONFIG.VENDOR.price.monthly}
              <span className="text-base font-normal text-muted-foreground">
                /mo
              </span>
            </div>
            <ul className="space-y-2">
              {TIER_CONFIG.VENDOR.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={currentTier === "VENDOR" || !!loading}
              onClick={() => handleUpgrade("VENDOR")}
            >
              {loading === "VENDOR" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : currentTier === "VENDOR" ? (
                "Current Plan"
              ) : (
                "Upgrade"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
