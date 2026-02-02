import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";
import { PlansSettingsPanel } from "./plans-settings-panel";

export default async function PlansAdminPage() {
  const adminStatus = await isAdmin();

  if (!adminStatus) {
    redirect("/dashboard");
  }

  const [settings, dbSettings] = await Promise.all([
    getPlatformSettings(),
    prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: { stripePricesLastSynced: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plan Configuration</h1>
        <p className="text-muted-foreground">
          Manage subscription tier pricing and features
        </p>
      </div>
      <PlansSettingsPanel
        settings={settings}
        lastSynced={dbSettings?.stripePricesLastSynced}
      />
    </div>
  );
}
