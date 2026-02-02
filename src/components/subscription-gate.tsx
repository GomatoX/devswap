"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Check, CreditCard, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createSubscriptionCheckout } from "@/app/(dashboard)/dashboard/billing/subscribe/actions";

interface SubscriptionGateProps {
  children: React.ReactNode;
  isActive: boolean;
  tier: string;
  isAdmin?: boolean;
  // Dynamic settings from admin
  buyerMonthlyPrice: number;
  buyerFeatures: string[];
}

export function SubscriptionGate({
  children,
  isActive,
  tier,
  isAdmin = false,
  buyerMonthlyPrice,
  buyerFeatures,
}: SubscriptionGateProps) {
  const [loading, setLoading] = useState(false);

  // If subscription is active or user is admin, render children normally
  if (isActive || isAdmin) {
    return <>{children}</>;
  }

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const result = await createSubscriptionCheckout();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.url) {
        // Redirect to Stripe Checkout directly
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to start subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show subscription required modal - DO NOT render children at all
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <Card className="max-w-md min-w-sm mx-4 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Subscription Required</CardTitle>
          <p className="text-muted-foreground mt-2">
            Activate your subscription to access this feature
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pricing */}
          <div className="text-center py-4 bg-muted/50 rounded-lg">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">€{buyerMonthlyPrice}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Cancel anytime</p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {buyerFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA - Direct checkout */}
          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe Now
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure payment with Stripe.
              <Link href="/pricing" className="underline ml-1">
                View all plans
              </Link>
            </p>
          </div>

          {/* Current status */}
          {tier && tier !== "FREE" && (
            <div className="pt-4 border-t text-center">
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-300"
              >
                <Zap className="mr-1 h-3 w-3" />
                Subscription expired
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
