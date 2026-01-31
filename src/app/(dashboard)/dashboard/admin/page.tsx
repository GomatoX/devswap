import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import {
  getCompanies,
  getPlatformStats,
  getPlatformSettingsWithStats,
} from "./actions";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  const adminStatus = await isAdmin();

  if (!adminStatus) {
    redirect("/dashboard");
  }

  const [companiesResult, statsResult, settingsResult] = await Promise.all([
    getCompanies(),
    getPlatformStats(),
    getPlatformSettingsWithStats(),
  ]);

  return (
    <AdminClient
      companies={companiesResult.success ? companiesResult.data || [] : []}
      stats={statsResult.success && statsResult.data ? statsResult.data : null}
      platformSettings={
        settingsResult.success && settingsResult.data
          ? settingsResult.data
          : null
      }
    />
  );
}
