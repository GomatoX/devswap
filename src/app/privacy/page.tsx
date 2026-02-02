import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "DevSwap privacy policy and data handling practices.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: February 1, 2026
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              DevSwap (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is
              committed to protecting your privacy. This Privacy Policy explains
              how we collect, use, and safeguard your information when you use
              our B2B IT resource sharing platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              2. Information We Collect
            </h2>
            <p className="text-muted-foreground">
              We collect information that you provide directly to us:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
              <li>Account information (name, email, company details)</li>
              <li>Developer profiles and listing information</li>
              <li>Communication and messaging data</li>
              <li>Payment and billing information</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-muted-foreground">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
              <li>Provide and maintain our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Improve and develop new features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies and similar tracking technologies to track activity
              on our service and hold certain information. You can instruct your
              browser to refuse all cookies or to indicate when a cookie is
              being sent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              5. Data Security
            </h2>
            <p className="text-muted-foreground">
              We implement appropriate security measures to protect your
              personal information. However, no method of transmission over the
              Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please
              contact us at{" "}
              <a
                href="mailto:hello@devswap.io"
                className="text-primary hover:underline"
              >
                hello@devswap.io
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
