import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getRequest } from "../actions";
import { RequestDetailClient } from "./request-detail-client";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const [result, settings] = await Promise.all([
    getRequest(id),
    getPlatformSettings(),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <RequestDetailClient
      request={result.data}
      matchmakingFee={settings.matchmakingFee}
    />
  );
}
