"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Users,
  Briefcase,
  MoreVertical,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { verifyCompany, suspendCompany } from "./actions";
import { PlatformSettingsPanel } from "./platform-settings-panel";
import { type PlatformSettings } from "@/lib/platform-settings";

type Company = {
  id: string;
  name: string;
  slug: string;
  registrationCode: string;
  status: string;
  createdAt: Date | string;
  users: Array<{
    id: string;
    fullName: string | null;
    email: string;
    role: string;
  }>;
  _count: {
    developers: number;
    purchases: number;
    sales: number;
  };
};

type Stats = {
  totalCompanies: number;
  pendingCompanies: number;
  totalDevelopers: number;
  activeListings: number;
  totalRequests: number;
  completedRequests: number;
} | null;

type PlatformSettingsData = {
  settings: PlatformSettings;
  foundingStats: {
    count: number;
    limit: number;
    slotsRemaining: number;
  };
} | null;

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING_VERIFICATION: { label: "Pending", color: "bg-yellow-500" },
  ACTIVE: { label: "Active", color: "bg-green-500" },
  SUSPENDED: { label: "Suspended", color: "bg-red-500" },
};

export function AdminClient({
  companies,
  stats,
  platformSettings,
}: {
  companies: Company[];
  stats: Stats;
  platformSettings: PlatformSettingsData;
}) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);

  const pendingCompanies = companies.filter(
    (c) => c.status === "PENDING_VERIFICATION",
  );
  const activeCompanies = companies.filter((c) => c.status === "ACTIVE");
  const suspendedCompanies = companies.filter((c) => c.status === "SUSPENDED");

  const handleVerify = async (id: string) => {
    setProcessing(id);
    const result = await verifyCompany(id);
    if (result.success) {
      toast.success("Company verified");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to verify");
    }
    setProcessing(null);
  };

  const handleSuspend = async (id: string) => {
    setProcessing(id);
    const result = await suspendCompany(id);
    if (result.success) {
      toast.success("Company suspended");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to suspend");
    }
    setProcessing(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage companies and monitor platform activity
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Companies
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompanies}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingCompanies} pending verification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Developers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDevelopers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeListings} active listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Requests
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedRequests} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRequests > 0
                  ? Math.round(
                      (stats.completedRequests / stats.totalRequests) * 100,
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                Of all engagement requests
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform Settings */}
      {platformSettings && (
        <PlatformSettingsPanel
          settings={platformSettings.settings}
          foundingStats={platformSettings.foundingStats}
        />
      )}

      {/* Companies Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Company Management</CardTitle>
          <CardDescription>
            Review and manage registered companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingCompanies.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeCompanies.length})
              </TabsTrigger>
              <TabsTrigger value="suspended">
                Suspended ({suspendedCompanies.length})
              </TabsTrigger>
              <TabsTrigger value="all">All ({companies.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <CompanyTable
                companies={pendingCompanies}
                processing={processing}
                onVerify={handleVerify}
                onSuspend={handleSuspend}
              />
            </TabsContent>

            <TabsContent value="active">
              <CompanyTable
                companies={activeCompanies}
                processing={processing}
                onVerify={handleVerify}
                onSuspend={handleSuspend}
              />
            </TabsContent>

            <TabsContent value="suspended">
              <CompanyTable
                companies={suspendedCompanies}
                processing={processing}
                onVerify={handleVerify}
                onSuspend={handleSuspend}
              />
            </TabsContent>

            <TabsContent value="all">
              <CompanyTable
                companies={companies}
                processing={processing}
                onVerify={handleVerify}
                onSuspend={handleSuspend}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function CompanyTable({
  companies,
  processing,
  onVerify,
  onSuspend,
}: {
  companies: Company[];
  processing: string | null;
  onVerify: (id: string) => void;
  onSuspend: (id: string) => void;
}) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No companies in this category
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Registration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Users</TableHead>
          <TableHead>Activity</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map((company) => {
          const status =
            statusConfig[company.status] || statusConfig.PENDING_VERIFICATION;

          return (
            <TableRow key={company.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{company.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {company.slug}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {company.registrationCode}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={`${status.color} text-white`}
                >
                  {status.label}
                </Badge>
              </TableCell>
              <TableCell>{company.users.length}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{company._count.developers} developers</p>
                  <p className="text-xs text-muted-foreground">
                    {company._count.purchases + company._count.sales} deals
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={processing === company.id}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {company.status !== "ACTIVE" && (
                      <DropdownMenuItem onClick={() => onVerify(company.id)}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Verify
                      </DropdownMenuItem>
                    )}
                    {company.status !== "SUSPENDED" && (
                      <DropdownMenuItem
                        onClick={() => onSuspend(company.id)}
                        className="text-red-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Suspend
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
