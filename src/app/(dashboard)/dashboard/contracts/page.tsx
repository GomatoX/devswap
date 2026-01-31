import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getContracts } from "./actions";
import { ContractsClient } from "./contracts-client";

export default async function ContractsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getContracts();

  if (!result.success) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load contracts</p>
      </div>
    );
  }

  return (
    <ContractsClient
      contracts={result.data || []}
      currentCompanyId={result.companyId || ""}
    />
  );
}
