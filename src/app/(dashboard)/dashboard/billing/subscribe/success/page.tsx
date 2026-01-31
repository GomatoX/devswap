import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";

export default async function SubscribeSuccessPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container max-w-lg py-20">
      <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-green-900 dark:text-green-100">
            Subscription Activated!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            Thank you for subscribing to DevSwap Pro. You now have full access
            to the platform.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-green-700 dark:text-green-300 bg-green-100/50 dark:bg-green-900/50 py-3 px-4 rounded-lg">
            <Sparkles className="h-4 w-4" />
            <span>Your subscription is now active</span>
          </div>

          <div className="pt-4 space-y-3">
            <Link href="/dashboard/market" className="block">
              <Button className="w-full" size="lg">
                Explore Marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground pt-4">
            You can manage your subscription anytime from the{" "}
            <Link href="/dashboard/billing" className="underline">
              Billing page
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
