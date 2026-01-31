import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTimesheets } from "./actions";
import { TimesheetsClient } from "./timesheets-client";

export default async function TimesheetsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getTimesheets();

  if (!result.success) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load timesheets</p>
      </div>
    );
  }

  return (
    <TimesheetsClient
      timesheets={result.data || []}
      currentCompanyId={result.companyId || ""}
    />
  );
}
