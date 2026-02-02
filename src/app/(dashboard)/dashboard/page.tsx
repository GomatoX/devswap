import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  Briefcase,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Check,
  FileText,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

async function getCurrentCompany() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { company: true },
  });

  return user?.company || null;
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const company = await getCurrentCompany();

  if (!company) {
    redirect("/onboarding");
  }

  // Fetch real stats
  const [
    developerCount,
    listingCount,
    pendingRequestCount,
    recentRequests,
    recentContracts,
  ] = await Promise.all([
    // Count developers for this company
    prisma.developer.count({
      where: { companyId: company.id },
    }),
    // Count active listings
    prisma.listing.count({
      where: {
        developer: { companyId: company.id },
        status: "ACTIVE",
      },
    }),
    // Count pending requests (where company is vendor or client)
    prisma.request.count({
      where: {
        OR: [{ vendorId: company.id }, { clientId: company.id }],
        status: { in: ["PENDING", "NEGOTIATING"] },
      },
    }),
    // Recent requests
    prisma.request.findMany({
      where: {
        OR: [{ vendorId: company.id }, { clientId: company.id }],
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        listing: {
          include: {
            developer: { select: { pseudonym: true } },
          },
        },
        client: { select: { name: true } },
        vendor: { select: { name: true } },
      },
    }),
    // Recent contracts
    prisma.contract.findMany({
      where: {
        request: {
          OR: [{ vendorId: company.id }, { clientId: company.id }],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        request: {
          include: {
            listing: {
              include: {
                developer: { select: { pseudonym: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  // Build recent activity from requests and contracts
  type ActivityItem = {
    id: string;
    type: "request" | "contract";
    title: string;
    description: string;
    status: string;
    time: Date;
  };

  const activities: ActivityItem[] = [
    ...recentRequests.map((req) => ({
      id: req.id,
      type: "request" as const,
      title: `Request: ${req.listing.developer.pseudonym}`,
      description: `${req.vendorId === company.id ? "From" : "To"} ${req.vendorId === company.id ? req.client.name : req.vendor.name}`,
      status: req.status,
      time: req.updatedAt,
    })),
    ...recentContracts.map((contract) => ({
      id: contract.id,
      type: "contract" as const,
      title: contract.title,
      description: `Contract for ${contract.request.listing.developer.pseudonym}`,
      status: contract.status,
      time: contract.createdAt,
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 5);

  const stats = [
    {
      title: "Listed Developers",
      value: String(developerCount),
      description: "Resources on bench",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Active Listings",
      value: String(listingCount),
      description: "Published to marketplace",
      icon: Briefcase,
      color: "text-green-500",
    },
    {
      title: "Pending Requests",
      value: String(pendingRequestCount),
      description: "Awaiting response",
      icon: MessageSquare,
      color: "text-orange-500",
    },
    {
      title: "Total Revenue",
      value: "€0",
      description: "This month",
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  // Getting started steps
  const steps = [
    {
      number: 1,
      title: "Add your first developer",
      description: "List available resources on your bench",
      completed: developerCount > 0,
      href: "/dashboard/bench",
      buttonText: developerCount > 0 ? "View" : "Add",
    },
    {
      number: 2,
      title: "Create a listing",
      description: "Make your developers discoverable",
      completed: listingCount > 0,
      href: "/dashboard/bench",
      buttonText: listingCount > 0 ? "View" : "Create",
      disabled: developerCount === 0,
    },
    {
      number: 3,
      title: "Explore the marketplace",
      description: "Find resources for your projects",
      completed: false,
      href: "/dashboard/market",
      buttonText: "Browse",
    },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    NEGOTIATING: "bg-blue-500",
    OFFER_SENT: "bg-indigo-500",
    ACCEPTED: "bg-green-500",
    REJECTED: "bg-red-500",
    DRAFT: "bg-gray-500",
    ACTIVE: "bg-emerald-500",
    COMPLETED: "bg-primary",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your activity.
          </p>
        </div>
        <Link href="/dashboard/bench">
          <Button>
            Add Resource
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Complete these steps to start using DevSwap
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center gap-4">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.completed ? <Check className="h-4 w-4" /> : step.number}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${step.completed ? "line-through text-muted-foreground" : ""}`}
                  >
                    {step.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                <Link href={step.href}>
                  <Button variant="outline" size="sm" disabled={step.disabled}>
                    {step.buttonText}
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Status</CardTitle>
            <CardDescription>Your account verification status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verification Status</span>
              <Badge
                variant={
                  company.status === "VERIFIED" ? "default" : "secondary"
                }
              >
                {company.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Subscription</span>
              <Badge variant="outline">{company.subscriptionTier}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Developers</span>
              <span className="text-sm text-muted-foreground">
                {developerCount} registered
              </span>
            </div>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full mt-4">
                Manage Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest platform interactions</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No activity yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start by adding developers to your bench
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center gap-4"
                >
                  <div className="rounded-full bg-muted p-2">
                    {activity.type === "request" ? (
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={statusColors[activity.status] || "bg-gray-500"}
                    >
                      {activity.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(activity.time, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
