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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings, Crown, Zap, Users, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updatePlatformSettingsAction } from "./actions";
import { type PlatformSettings } from "@/lib/platform-settings";

type FoundingStats = {
  count: number;
  limit: number;
  slotsRemaining: number;
};

type PlatformSettingsPanelProps = {
  settings: PlatformSettings;
  foundingStats: FoundingStats;
};

export function PlatformSettingsPanel({
  settings: initialSettings,
  foundingStats,
}: PlatformSettingsPanelProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleToggleBetaMode = async () => {
    setSaving(true);
    const newValue = !formData.betaMode;
    const result = await updatePlatformSettingsAction({ betaMode: newValue });

    if (result.success) {
      setFormData((prev) => ({ ...prev, betaMode: newValue }));
      toast.success(newValue ? "Beta mode enabled" : "Beta mode disabled");
    } else {
      toast.error(result.error || "Failed to update");
    }
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updatePlatformSettingsAction(formData);

    if (result.success) {
      toast.success("Settings saved successfully");
      setHasChanges(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save settings");
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Settings
            </CardTitle>
            <CardDescription>
              Configure Beta mode and founding member program
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-600"
              >
                Unsaved Changes
              </Badge>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              size="sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Beta Mode Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold">Beta Mode</h3>
              <p className="text-sm text-muted-foreground">
                When ON, subscription is not required for access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={formData.betaMode ? "default" : "secondary"}
              className={formData.betaMode ? "bg-violet-500" : ""}
            >
              {formData.betaMode ? "ON" : "OFF"}
            </Badge>
            <Switch
              checked={formData.betaMode}
              onCheckedChange={handleToggleBetaMode}
              disabled={saving}
            />
          </div>
        </div>

        <Separator />

        {/* Founding Member Program */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">Founding Member Program</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Progress */}
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  Members
                </span>
                <Users className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {foundingStats.count} / {foundingStats.limit}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {foundingStats.slotsRemaining} slots remaining
              </p>
            </div>

            {/* Limit */}
            <div className="space-y-2">
              <Label htmlFor="foundingLimit">Member Limit</Label>
              <Input
                id="foundingLimit"
                type="number"
                value={formData.foundingMemberLimit}
                onChange={(e) =>
                  handleChange(
                    "foundingMemberLimit",
                    parseInt(e.target.value) || 0,
                  )
                }
              />
            </div>

            {/* Discounted Fee */}
            <div className="space-y-2">
              <Label htmlFor="foundingFee">Discounted Fee (€)</Label>
              <Input
                id="foundingFee"
                type="number"
                value={formData.foundingMemberFee}
                onChange={(e) =>
                  handleChange(
                    "foundingMemberFee",
                    parseInt(e.target.value) || 0,
                  )
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
