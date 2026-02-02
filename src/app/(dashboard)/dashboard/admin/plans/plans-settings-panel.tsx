"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Euro, Loader2, Save, ListChecks, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  updatePlatformSettingsAction,
  syncPricesToStripeAction,
} from "../actions";
import { type PlatformSettings } from "@/lib/platform-settings";

type PlansSettingsPanelProps = {
  settings: PlatformSettings;
  lastSynced?: Date | null;
};

export function PlansSettingsPanel({
  settings: initialSettings,
  lastSynced,
}: PlansSettingsPanelProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updatePlatformSettingsAction(formData);

    if (result.success) {
      toast.success("Plan settings saved");
      setHasChanges(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save");
    }
    setSaving(false);
  };

  const handleSyncToStripe = async () => {
    setSyncing(true);
    const result = await syncPricesToStripeAction();

    if (result.success) {
      toast.success("Prices synced to Stripe!", {
        description: `New prices created and old ones archived`,
      });
      router.refresh();
    } else {
      toast.error(result.error || "Failed to sync prices to Stripe");
    }
    setSyncing(false);
  };

  const currencySymbol = formData.currency === "EUR" ? "€" : "$";

  return (
    <div className="space-y-6">
      {/* Save Header */}
      <div className="flex items-center justify-end gap-4">
        {lastSynced && (
          <span className="text-xs text-muted-foreground">
            Stripe synced: {new Date(lastSynced).toLocaleDateString()}
          </span>
        )}
        {hasChanges && (
          <span className="text-sm text-amber-600">Unsaved changes</span>
        )}
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={handleSyncToStripe}
          disabled={syncing || hasChanges}
          title={hasChanges ? "Save changes first" : "Create new Stripe prices"}
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync to Stripe
        </Button>
      </div>

      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-green-500" />
            Pricing
          </CardTitle>
          <CardDescription>
            Set subscription prices for each tier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency */}
          <div className="flex items-center gap-4">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) =>
                handleChange("currency", e.target.value as "USD" | "EUR")
              }
              className="px-3 py-2 rounded-md border bg-background"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          <Separator />

          {/* Free Tier */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <h4 className="font-medium mb-3">Free Tier</h4>
            <p className="text-sm text-muted-foreground">
              {currencySymbol}0/month - Always free
            </p>
          </div>

          {/* Buyer Tier */}
          <div className="p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20">
            <h4 className="font-medium mb-3">Buyer Tier</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buyerMonthly">
                  Monthly Price ({currencySymbol})
                </Label>
                <Input
                  id="buyerMonthly"
                  type="number"
                  value={formData.buyerMonthlyPrice}
                  onChange={(e) =>
                    handleChange(
                      "buyerMonthlyPrice",
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyerYearly">
                  Yearly Price ({currencySymbol})
                </Label>
                <Input
                  id="buyerYearly"
                  type="number"
                  value={formData.buyerYearlyPrice}
                  onChange={(e) =>
                    handleChange(
                      "buyerYearlyPrice",
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Matchmaking Fee */}
          <div className="space-y-4 p-4 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20">
            <h4 className="font-medium">Matchmaking</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="matchFee">Fee ({currencySymbol})</Label>
                <Input
                  id="matchFee"
                  type="number"
                  value={formData.matchmakingFee}
                  onChange={(e) =>
                    handleChange(
                      "matchmakingFee",
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matchDesc">Short Description</Label>
                <Input
                  id="matchDesc"
                  value={formData.matchmakingDescription}
                  onChange={(e) =>
                    handleChange("matchmakingDescription", e.target.value)
                  }
                  placeholder="Success fee on completed contracts"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="matchDetails">Detailed Description</Label>
              <textarea
                id="matchDetails"
                className="w-full min-h-[80px] px-3 py-2 rounded-md border bg-background text-sm"
                value={formData.matchmakingDetails}
                onChange={(e) =>
                  handleChange("matchmakingDetails", e.target.value)
                }
                placeholder="Explanation shown on pricing page..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matchFeatures">
                Matchmaking Features (one per line)
              </Label>
              <textarea
                id="matchFeatures"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border bg-background text-sm"
                value={formData.matchmakingFeatures.join("\n")}
                onChange={(e) =>
                  handleChange(
                    "matchmakingFeatures",
                    e.target.value.split("\n").filter((f) => f.trim()),
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Feature list shown in the Matchmaking card on pricing page
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-blue-500" />
            Plan Features
          </CardTitle>
          <CardDescription>
            Edit feature lists displayed on billing and pricing pages. One
            feature per line.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Free Features */}
          <div className="space-y-2">
            <Label htmlFor="freeFeatures">Free Tier Features</Label>
            <textarea
              id="freeFeatures"
              className="w-full min-h-[100px] px-3 py-2 rounded-md border bg-background text-sm"
              value={formData.freeFeatures.join("\n")}
              onChange={(e) =>
                handleChange(
                  "freeFeatures",
                  e.target.value.split("\n").filter((f) => f.trim()),
                )
              }
            />
          </div>

          {/* Buyer Features */}
          <div className="space-y-2">
            <Label htmlFor="buyerFeatures">Buyer Tier Features</Label>
            <textarea
              id="buyerFeatures"
              className="w-full min-h-[120px] px-3 py-2 rounded-md border bg-background text-sm"
              value={formData.buyerFeatures.join("\n")}
              onChange={(e) =>
                handleChange(
                  "buyerFeatures",
                  e.target.value.split("\n").filter((f) => f.trim()),
                )
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
