import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
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

const features = [
  {
    icon: "🎯",
    title: "Find Talent Fast",
    description:
      "Browse a curated marketplace of pre-vetted IT professionals ready to start immediately.",
  },
  {
    icon: "💼",
    title: "Monetize Your Bench",
    description:
      "Turn idle developers into revenue. List your available resources and receive inquiries.",
  },
  {
    icon: "🤝",
    title: "Secure Deals",
    description:
      "Built-in contracts, timesheets, and invoicing. Everything you need to manage engagements.",
  },
  {
    icon: "⭐",
    title: "Build Reputation",
    description:
      "Earn ratings from successful collaborations that help you win more business.",
  },
];

const steps = [
  {
    step: "01",
    title: "List Your Resources",
    description:
      "Create profiles for your available developers with skills, rates & availability.",
  },
  {
    step: "02",
    title: "Discover & Connect",
    description:
      "Browse the marketplace, filter by skills and dates, and send engagement requests.",
  },
  {
    step: "03",
    title: "Close & Manage",
    description:
      "Negotiate terms, sign contracts, and manage timesheets all within the platform.",
  },
];

function formatEUR(amount: number): string {
  return `€${amount}`;
}

function getPricingTiers(
  settings: Awaited<ReturnType<typeof getPlatformSettings>>,
) {
  return [
    {
      name: "Free",
      price: "€0",
      period: "/mo",
      description:
        "Perfect for companies looking to list their bench resources",
      features: settings.freeFeatures,
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Buyer",
      price: formatEUR(settings.buyerMonthlyPrice),
      period: "/mo",
      description: "For companies actively seeking IT resources",
      features: settings.buyerFeatures,
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Matchmaking",
      price: formatEUR(settings.matchmakingFee),
      period: "one-time",
      description: settings.matchmakingDescription,
      features: settings.matchmakingFeatures,
      cta: "Learn More",
      popular: false,
    },
  ];
}

export default async function HomePage() {
  const { userId } = await auth();
  const isSignedIn = !!userId;
  const settings = await getPlatformSettings();
  const pricingTiers = getPricingTiers(settings);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              DS
            </div>
            <span className="text-xl font-bold">DevSwap</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-6">
                🚀 The B2B IT Talent Marketplace
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Turn Your Bench Into{" "}
                <span className="text-primary">Revenue</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                DevSwap connects IT companies to share developer resources. List
                your available talent or find skilled professionals for your
                projects — all in one secure platform.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                  <Button size="lg" className="h-12 px-8">
                    {isSignedIn ? "Go to Dashboard" : "Start Free"}
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="outline" size="lg" className="h-12 px-8">
                    See How It Works
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required • Free forever for listing resources
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need to Succeed
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                A complete platform for IT resource sharing between companies
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="border-0 bg-background shadow-lg"
                >
                  <CardHeader>
                    <div className="text-4xl mb-2">{feature.icon}</div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How DevSwap Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Get started in minutes, not days
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.step} className="relative">
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-border" />
                  )}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Free to list. Pay only when you need to hire.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={`relative ${
                    tier.popular
                      ? "border-primary shadow-xl scale-105"
                      : "border-border"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">
                        {tier.period}
                      </span>
                    </div>
                    <CardDescription className="mt-2">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm"
                        >
                          <svg
                            className="h-4 w-4 text-primary flex-shrink-0"
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
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={isSignedIn ? "/dashboard" : "/sign-up"}
                      className="block"
                    >
                      <Button
                        className="w-full"
                        variant={tier.popular ? "default" : "outline"}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Transform Your IT Business?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join hundreds of IT companies already sharing resources on
                DevSwap. Get started for free today.
              </p>
              <div className="mt-10">
                <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                  <Button size="lg" className="h-12 px-8">
                    {isSignedIn ? "Go to Dashboard" : "Get Started Free"}
                  </Button>
                </Link>
              </div>
            </div>
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
              <span className="text-muted-foreground/60 cursor-not-allowed">
                Terms of Service
              </span>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <a
                href="mailto:hello@devswap.io"
                className="hover:text-foreground"
              >
                Contact
              </a>
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
