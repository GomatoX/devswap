"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    registrationCode: "",
    vatCode: "",
    website: "",
    description: "",
    termsAccepted: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.termsAccepted) {
      toast.error("You must accept the Terms of Service to continue");
      return;
    }

    setLoading(true);

    try {
      // Update Clerk user metadata with company info
      await user?.update({
        unsafeMetadata: {
          companyName: formData.companyName,
          registrationCode: formData.registrationCode,
          vatCode: formData.vatCode,
          website: formData.website,
          description: formData.description,
          termsAccepted: formData.termsAccepted,
          termsVersion: "v1.0",
          onboardingComplete: true,
        },
      });

      toast.success("Company profile created successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              DS
            </div>
            <span className="text-2xl font-bold">DevSwap</span>
          </Link>
          <h1 className="text-3xl font-bold">Welcome to DevSwap!</h1>
          <p className="text-muted-foreground mt-2">
            Let&apos;s set up your company profile to get started.
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              This information will be visible to other companies on the
              platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Acme IT Solutions"
                    required
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationCode">Registration Code *</Label>
                  <Input
                    id="registrationCode"
                    placeholder="123456789"
                    required
                    value={formData.registrationCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationCode: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vatCode">VAT Code (Optional)</Label>
                  <Input
                    id="vatCode"
                    placeholder="LT123456789"
                    value={formData.vatCode}
                    onChange={(e) =>
                      setFormData({ ...formData, vatCode: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell other companies about your business..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* Terms of Service */}
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        termsAccepted: checked === true,
                      })
                    }
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      I agree to the Terms of Service *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      By checking this box, you agree to our{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="text-primary hover:underline"
                      >
                        Terms of Service
                      </Link>
                      , including the non-circumvention clause and matchmaking
                      fee obligations.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Creating profile..." : "Complete Setup"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
