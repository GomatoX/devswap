"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Crown, Zap, Euro, Users, Loader2 } from "lucide-react";
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
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const handleToggleBetaMode = async () => {
    setSaving(true);
    const newValue = !settings.betaMode;
    const result = await updatePlatformSettingsAction({ betaMode: newValue });

    if (result.success) {
      setSettings({ ...settings, betaMode: newValue });
      toast.success(newValue ? "Beta mode enabled" : "Beta mode disabled");
    } else {
      toast.error(result.error || "Failed to update");
    }
    setSaving(false);
  };

  const handleUpdateSetting = async (
    key: keyof PlatformSettings,
    value: number,
  ) => {
    setSaving(true);
    const result = await updatePlatformSettingsAction({ [key]: value });

    if (result.success) {
      setSettings({ ...settings, [key]: value });
      toast.success("Setting updated");
    } else {
      toast.error(result.error || "Failed to update");
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
              Configure Beta mode, pricing, and founding member program
            </CardDescription>
          </div>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
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
              variant={settings.betaMode ? "default" : "secondary"}
              className={settings.betaMode ? "bg-violet-500" : ""}
            >
              {settings.betaMode ? "ON" : "OFF"}
            </Badge>
            <Switch
              checked={settings.betaMode}
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
                defaultValue={settings.foundingMemberLimit}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0 && val !== settings.foundingMemberLimit) {
                    handleUpdateSetting("foundingMemberLimit", val);
                  }
                }}
              />
            </div>

            {/* Discounted Fee */}
            <div className="space-y-2">
              <Label htmlFor="foundingFee">Discounted Fee (€)</Label>
              <Input
                id="foundingFee"
                type="number"
                defaultValue={settings.foundingMemberFee}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 0 && val !== settings.foundingMemberFee) {
                    handleUpdateSetting("foundingMemberFee", val);
                  }
                }}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Pricing Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">Pricing Configuration</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subPrice">Subscription Price (€/month)</Label>
              <Input
                id="subPrice"
                type="number"
                defaultValue={settings.subscriptionPrice}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0 && val !== settings.subscriptionPrice) {
                    handleUpdateSetting("subscriptionPrice", val);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="matchFee">Matchmaking Fee (€)</Label>
              <Input
                id="matchFee"
                type="number"
                defaultValue={settings.matchmakingFee}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0 && val !== settings.matchmakingFee) {
                    handleUpdateSetting("matchmakingFee", val);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
