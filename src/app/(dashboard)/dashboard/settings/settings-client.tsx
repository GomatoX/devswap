"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { updateCompanyProfile } from "./actions";
import { getAllCountries, PRIORITY_COUNTRIES } from "@/lib/constants/countries";

type Company = {
  id: string;
  name: string;
  slug: string;
  registrationCode: string;
  vatCode: string | null;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  status: string;
  country: string | null;
};

type SettingsClientProps = {
  company: Company | null;
  isProfileComplete: boolean;
};

export function SettingsClient({
  company,
  isProfileComplete,
}: SettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: company?.name || "",
    registrationCode: company?.registrationCode || "",
    vatCode: company?.vatCode || "",
    website: company?.website || "",
    description: company?.description || "",
    country: company?.country || "",
  });

  // Get sorted countries with priority countries first
  const countries = useMemo(() => {
    const all = getAllCountries();
    const priority = all.filter((c) => PRIORITY_COUNTRIES.includes(c.code));
    const rest = all.filter((c) => !PRIORITY_COUNTRIES.includes(c.code));
    return [...priority, ...rest];
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateCompanyProfile({
      name: formData.name,
      registrationCode: formData.registrationCode,
      vatCode: formData.vatCode || undefined,
      website: formData.website || undefined,
      description: formData.description,
      country: formData.country || undefined,
    });

    if (result.success) {
      toast.success("Company profile updated!");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company profile and preferences
        </p>
      </div>

      {/* Profile Completion Alert */}
      {!isProfileComplete && (
        <Card className="border-orange-500/50 bg-orange-500/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-medium text-orange-500">
                Complete your company profile
              </p>
              <p className="text-sm text-muted-foreground">
                You must complete your company profile before adding developers
                to the marketplace.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Company Profile</CardTitle>
                  <CardDescription>
                    Update your company information visible to other users
                  </CardDescription>
                </div>
                {isProfileComplete ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr.1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-orange-500/20 text-orange-500"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Incomplete
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Your Company Ltd"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationCode">
                      Registration Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="registrationCode"
                      value={formData.registrationCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registrationCode: e.target.value,
                        })
                      }
                      placeholder="123456789"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vatCode">VAT Code (optional)</Label>
                    <Input
                      id="vatCode"
                      value={formData.vatCode}
                      onChange={(e) =>
                        setFormData({ ...formData, vatCode: e.target.value })
                      }
                      placeholder="LT123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) =>
                      setFormData({ ...formData, country: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country, index) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                          {index === PRIORITY_COUNTRIES.length - 1 && (
                            <span className="sr-only">
                              {" "}
                              (end of priority countries)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Tell others about your company (min 10 characters)..."
                    rows={4}
                    required
                    minLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/10 characters minimum
                  </p>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>
                Your company verification and trust level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Company Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Verified companies get priority placement
                  </p>
                </div>
                <Badge
                  variant={
                    company?.status === "ACTIVE" ? "default" : "secondary"
                  }
                >
                  {company?.status === "ACTIVE" ? "Verified" : "Pending"}
                </Badge>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                To get verified, please ensure your company registration code is
                valid and your profile is complete. Our team will review within
                2-3 business days.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-lg">Free Plan</p>
                  <p className="text-sm text-muted-foreground">
                    Unlimited listings, browse marketplace
                  </p>
                </div>
                <Badge variant="outline">Current</Badge>
              </div>

              <div className="p-4 border rounded-lg border-primary bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-lg">Buyer Plan</p>
                  <span className="font-bold">€49/mo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Send engagement requests, in-app messaging, priority support
                </p>
                <Button>Upgrade to Buyer</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what updates you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Engagement Requests</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone wants to engage your resources
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Messages</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email when you get new messages
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Platform Updates</p>
                  <p className="text-sm text-muted-foreground">
                    News about new features and improvements
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Disabled
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
