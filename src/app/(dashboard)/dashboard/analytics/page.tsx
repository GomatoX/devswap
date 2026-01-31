import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAnalyticsData } from "./actions";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getAnalyticsData();

  if (!result.success || !result.data) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load analytics</p>
      </div>
    );
  }

  return <AnalyticsClient data={result.data} />;
}
