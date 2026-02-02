import { getAllCompaniesWithDetails } from "../actions";
import { CompaniesClient } from "./companies-client";

export default async function CompaniesPage() {
  const result = await getAllCompaniesWithDetails();

  if (!result.success || !result.data) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Company Management</h1>
        <p className="text-muted-foreground">Failed to load companies.</p>
      </div>
    );
  }

  return <CompaniesClient companies={result.data} />;
}
