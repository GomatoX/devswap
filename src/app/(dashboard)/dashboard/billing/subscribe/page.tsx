import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  ArrowLeft,
  Shield,
  Zap,
  Users,
  MessageSquare,
} from "lucide-react";
import { checkSubscription } from "@/lib/subscription";
import { SubscribeButton } from "./subscribe-button";

const features = [
  {
    icon: Users,
    title: "Developer Marketplace",
    description: "Access all available developer listings",
  },
  {
    icon: MessageSquare,
    title: "In-App Messaging",
    description: "Negotiate terms securely on the platform",
  },
  {
    icon: Shield,
    title: "Verified Companies",
    description: "All companies are verified before access",
  },
  {
    icon: Zap,
    title: "Fast Matching",
    description: "Find the right developer quickly",
  },
];

const includedItems = [
  "Unlimited developer browsing",
  "Send engagement requests",
  "In-app messaging & negotiation",
  "Company profile & branding",
  "Analytics dashboard",
  "Contract management tools",
  "Priority support",
];

async function SubscriptionStatus() {
  const subscription = await checkSubscription();

  if (subscription.isActive) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="mb-4">
          Platform Subscription
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">
          Activate Your Subscription
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Get full access to DevSwap and start finding or offering developer
          talent today.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="max-w-md mx-auto">
        <Card className="border-2 border-primary shadow-lg">
          <CardHeader className="text-center pb-4">
            <Badge className="w-fit mx-auto mb-2">Most Popular</Badge>
            <CardTitle className="text-2xl">DevSwap Pro</CardTitle>
            <div className="mt-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">€49</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Billed monthly · Cancel anytime
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features list */}
            <div className="space-y-3">
              {includedItems.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* Subscribe button */}
            <SubscribeButton />

            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Stripe
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature highlights */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto pt-8">
        {features.map((feature) => (
          <div key={feature.title} className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <feature.icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Back link */}
      <div className="text-center pt-4">
        <Link href="/dashboard/billing">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default async function SubscribePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container max-w-5xl py-10">
      <Suspense
        fallback={
          <div className="space-y-6 text-center">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-[400px] w-full max-w-md mx-auto" />
          </div>
        }
      >
        <SubscriptionStatus />
      </Suspense>
    </div>
  );
}
