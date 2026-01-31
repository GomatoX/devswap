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
} from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Placeholder stats - will be replaced with real data
  const stats = [
    {
      title: "Listed Developers",
      value: "0",
      description: "Active resources on bench",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Active Listings",
      value: "0",
      description: "Published to marketplace",
      icon: Briefcase,
      color: "text-green-500",
    },
    {
      title: "Engagement Requests",
      value: "0",
      description: "Pending responses",
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
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">Add your first developer</p>
                <p className="text-sm text-muted-foreground">
                  List available resources on your bench
                </p>
              </div>
              <Link href="/dashboard/bench">
                <Button variant="outline" size="sm">
                  Add
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">Create a listing</p>
                <p className="text-sm text-muted-foreground">
                  Make your developers discoverable
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Soon
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">Explore the marketplace</p>
                <p className="text-sm text-muted-foreground">
                  Find resources for your projects
                </p>
              </div>
              <Link href="/dashboard/market">
                <Button variant="outline" size="sm">
                  Browse
                </Button>
              </Link>
            </div>
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
              <Badge variant="secondary">Pending</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Subscription</span>
              <Badge variant="outline">Free</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Listings Remaining</span>
              <span className="text-sm text-muted-foreground">Unlimited</span>
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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium">No activity yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Start by adding developers to your bench
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
