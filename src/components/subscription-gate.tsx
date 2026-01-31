"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Check, CreditCard, Zap } from "lucide-react";

interface SubscriptionGateProps {
  children: React.ReactNode;
  isActive: boolean;
  tier: string;
}

const features = [
  "Access to developer marketplace",
  "Create and manage listings",
  "Send engagement requests",
  "In-app messaging",
  "Analytics dashboard",
  "Contract management",
];

export function SubscriptionGate({
  children,
  isActive,
  tier,
}: SubscriptionGateProps) {
  // If subscription is active, render children normally
  if (isActive) {
    return <>{children}</>;
  }

  // Show subscription required overlay
  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Blurred background */}
      <div className="absolute inset-0 opacity-30 blur-sm pointer-events-none">
        {children}
      </div>

      {/* Subscription CTA overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="max-w-lg mx-4 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Subscription Required</CardTitle>
            <p className="text-muted-foreground mt-2">
              Activate your subscription to access the DevSwap platform
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing */}
            <div className="text-center py-4 bg-muted/50 rounded-lg">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">€49</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Cancel anytime
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <Link href="/dashboard/billing/subscribe" className="block">
                <Button className="w-full" size="lg">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe Now
                </Button>
              </Link>
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
    </div>
  );
}
