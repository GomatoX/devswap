import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
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
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: January 30, 2026
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using DevSwap (&quot;the Platform&quot;), you
              accept and agree to be bound by the terms and provisions of this
              agreement. If you do not agree to these terms, you should not use
              this Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              DevSwap is a B2B marketplace platform that facilitates the sharing
              of IT resources between companies. The Platform allows companies
              to list available developers and find IT professionals for
              temporary engagements.
            </p>
          </section>

          <section className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-destructive">
              3. Non-Circumvention Agreement
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              <strong>IMPORTANT:</strong> By using this Platform, you agree to
              the following non-circumvention provisions:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>
                <strong>Direct Deal Prohibition:</strong> For a period of 24
                months from the date of initial contact made through the
                Platform, you agree not to engage in direct business
                relationships with any company or individual resource discovered
                through DevSwap without using the Platform&apos;s services.
              </li>
              <li>
                <strong>Matchmaking Fee Obligation:</strong> Any contract or
                engagement initiated through the Platform, regardless of where
                the final agreement is signed, is subject to the Platform&apos;s
                matchmaking fee of €500 per successful long-term engagement.
              </li>
              <li>
                <strong>Reporting Requirement:</strong> You must report any
                direct contact or negotiation attempts made by parties
                discovered through the Platform.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              4. Subscription Tiers
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">4.1 Free Tier</h3>
                <p className="text-muted-foreground">
                  Allows unlimited listing of developer resources and browsing
                  of the marketplace. Does not include the ability to initiate
                  contact with other companies.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium">
                  4.2 Buyer Tier (€49/month)
                </h3>
                <p className="text-muted-foreground">
                  Includes all Free tier features plus the ability to send
                  engagement requests, access to in-app messaging, and priority
                  support.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium">
                  4.3 Matchmaking Fee (€500 one-time)
                </h3>
                <p className="text-muted-foreground">
                  A success fee charged upon completion of a contract that
                  exceeds 4 weeks of engagement duration. This fee is payable by
                  the hiring company.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              5. Timesheets and Invoicing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              All engagements facilitated through the Platform must use the
              Platform&apos;s timesheet tracking system. Weekly timesheets must
              be submitted and approved through the Platform to ensure accurate
              billing and dispute resolution.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              6. Ratings and Reviews
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Upon completion of each engagement, both parties are encouraged to
              leave ratings and reviews. These ratings contribute to your
              company&apos;s reputation score and affect visibility in search
              results. Off-platform dealings do not contribute to your rating,
              reducing your competitiveness.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              7. Guarantees and Replacement
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If a resource engaged through the Platform fails to meet the
              described qualifications or leaves the engagement early, DevSwap
              will assist in finding a replacement resource at no additional
              matchmaking fee for the first 30 days of the original engagement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              DevSwap serves as a marketplace facilitator and does not directly
              employ or contract the resources listed on the Platform. DevSwap
              is not liable for the quality of work, disputes between parties,
              or any damages arising from engagements facilitated through the
              Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with
              the laws of the Republic of Lithuania, without regard to its
              conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              10. Contact Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us at
              legal@devswap.io.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <Link href="/sign-up">
            <Button size="lg">I Agree - Create Account</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
