"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  Clock,
  FileCheck,
  Receipt,
  BarChart3,
} from "lucide-react";

type AnalyticsData = {
  overview: {
    totalDevelopers: number;
    totalListings: number;
    activeListings: number;
    totalRequests: number;
    conversionRate: number;
    potentialRevenue: number;
  };
  engagement: {
    contracts: number;
    pendingTimesheets: number;
    unpaidInvoices: number;
    unpaidAmount: number;
  };
  requestsByStatus: {
    pending: number;
    negotiating: number;
    accepted: number;
    completed: number;
  };
  companyTier: string;
};

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const isVendor = data.companyTier === "VENDOR";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your performance and engagement metrics
          </p>
        </div>
        <Badge variant={isVendor ? "default" : "secondary"}>
          {data.companyTier} Plan
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Developers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalDevelopers}
            </div>
            <p className="text-xs text-muted-foreground">On your bench</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Listings
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.activeListings}
              <span className="text-sm font-normal text-muted-foreground">
                /{data.overview.totalListings}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Visible in marketplace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalRequests}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.overview.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Potential Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{data.overview.potentialRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From accepted deals</p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Stats (Vendor only shows full data) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Contracts
            </CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.engagement.contracts}
            </div>
            <p className="text-xs text-muted-foreground">Ongoing engagements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Timesheets
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.engagement.pendingTimesheets}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Unpaid Invoices
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.engagement.unpaidInvoices}
            </div>
            <p className="text-xs text-muted-foreground">
              €{data.engagement.unpaidAmount.toLocaleString()} outstanding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Request Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Request Status Breakdown
          </CardTitle>
          <CardDescription>
            Overview of all your requests by status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pending</span>
                <Badge variant="outline">{data.requestsByStatus.pending}</Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{
                    width: `${
                      data.overview.totalRequests > 0
                        ? (data.requestsByStatus.pending /
                            data.overview.totalRequests) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Negotiating</span>
                <Badge variant="outline">
                  {data.requestsByStatus.negotiating}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${
                      data.overview.totalRequests > 0
                        ? (data.requestsByStatus.negotiating /
                            data.overview.totalRequests) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Accepted</span>
                <Badge variant="outline">
                  {data.requestsByStatus.accepted}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${
                      data.overview.totalRequests > 0
                        ? (data.requestsByStatus.accepted /
                            data.overview.totalRequests) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completed</span>
                <Badge variant="outline">
                  {data.requestsByStatus.completed}
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${
                      data.overview.totalRequests > 0
                        ? (data.requestsByStatus.completed /
                            data.overview.totalRequests) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
