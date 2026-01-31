import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCompanyProfile, isCompanyProfileComplete } from "./actions";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [companyResult, isComplete] = await Promise.all([
    getCompanyProfile(),
    isCompanyProfileComplete(),
  ]);

  return (
    <SettingsClient
      company={companyResult.success ? (companyResult.data ?? null) : null}
      isProfileComplete={isComplete}
    />
  );
}
