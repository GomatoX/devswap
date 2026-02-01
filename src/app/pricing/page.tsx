import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPlatformSettings } from "@/lib/platform-settings";

function formatEUR(amount: number): string {
  return `€${amount}`;
}

function getTiers(subscriptionPrice: number) {
  return [
    {
      name: "Free",
      price: "€0",
      period: "/month",
      description: "For companies looking to list their available resources",
      features: [
        { text: "Unlimited developer listings", included: true },
        { text: "Public company profile", included: true },
        { text: "Browse full marketplace", included: true },
        { text: "Basic analytics dashboard", included: true },
        { text: "Send engagement requests", included: false },
        { text: "In-app messaging", included: false },
        { text: "Priority placement in search", included: false },
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Buyer",
      price: formatEUR(subscriptionPrice),
      period: "/month",
      description: "For companies actively seeking IT talent",
      features: [
        { text: "Everything in Free", included: true },
        { text: "Send unlimited engagement requests", included: true },
        { text: "In-app messaging & negotiations", included: true },
        { text: "Advanced search filters", included: true },
        { text: "Priority support", included: true },
        { text: "Saved searches & alerts", included: true },
        { text: "Export data & reports", included: true },
      ],
      cta: "Start 14-Day Free Trial",
      popular: true,
    },
  ];
}

function getFaqs(matchmakingFee: number) {
  return [
    {
      question: "What is the Matchmaking Fee?",
      answer: `The matchmaking fee is a one-time ${formatEUR(matchmakingFee)} success fee charged when a contract is completed that exceeds 4 weeks of engagement. It's only charged to the hiring company upon successful completion of the engagement.`,
    },
    {
      question: "Can I list resources for free?",
      answer:
        "Yes! Listing your available developers is completely free. We want to build a robust marketplace, so there's no cost to showcase your bench resources.",
    },
    {
      question: "What happens after the 14-day trial?",
      answer:
        "After your trial ends, you can continue using the Buyer tier for €49/month, or downgrade to the Free tier. All your data, conversations, and history will be preserved.",
    },
    {
      question: "Is there a long-term contract?",
      answer:
        "No. Buyer subscriptions are billed monthly and can be cancelled anytime. The only contractual obligation is the non-circumvention clause in our Terms of Service.",
    },
    {
      question: "What's included in the Replacement Guarantee?",
      answer:
        "If a developer engaged through DevSwap leaves or underperforms within the first 30 days, we'll help you find a replacement at no additional matchmaking fee.",
    },
  ];
}

export default async function PricingPage() {
  const settings = await getPlatformSettings();
  const tiers = getTiers(settings.subscriptionPrice);
  const faqs = getFaqs(settings.matchmakingFee);
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              DS
            </div>
            <span className="text-xl font-bold">DevSwap</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              Pricing
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Free to list your resources. Pay only when you need to hire.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              {tiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={`relative ${
                    tier.popular ? "border-primary shadow-xl" : "border-border"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-5xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">
                        {tier.period}
                      </span>
                    </div>
                    <CardDescription className="mt-2 text-base">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature) => (
                        <li
                          key={feature.text}
                          className="flex items-center gap-3 text-sm"
                        >
                          {feature.included ? (
                            <svg
                              className="h-5 w-5 text-primary flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-5 w-5 text-muted-foreground/40 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )}
                          <span
                            className={
                              feature.included ? "" : "text-muted-foreground/60"
                            }
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/sign-up" className="block">
                      <Button
                        className="w-full h-12"
                        variant={tier.popular ? "default" : "outline"}
                        size="lg"
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Matchmaking Fee Callout */}
            <div className="max-w-4xl mx-auto mt-12">
              <Card className="bg-muted/50 border-dashed">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                      🤝
                    </div>
                    <div>
                      <CardTitle>
                        Matchmaking Fee: {formatEUR(settings.matchmakingFee)}
                      </CardTitle>
                      <CardDescription>
                        One-time success fee per completed engagement
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This fee is only charged when a contract is successfully
                    completed (engagement lasting 4+ weeks). It covers contract
                    management, dispute resolution, timesheet verification, and
                    our replacement guarantee.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-6">
              {faqs.map((faq) => (
                <Card key={faq.question}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join DevSwap today. Start listing for free.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8">
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                DS
              </div>
              <span className="font-semibold">DevSwap</span>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2026 DevSwap. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
