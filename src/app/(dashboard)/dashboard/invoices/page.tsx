import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getInvoices } from "./actions";
import { InvoicesClient } from "./invoices-client";

export default async function InvoicesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getInvoices();

  if (!result.success) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load invoices</p>
      </div>
    );
  }

  return (
    <InvoicesClient
      invoices={result.data || []}
      currentCompanyId={result.companyId || ""}
    />
  );
}
