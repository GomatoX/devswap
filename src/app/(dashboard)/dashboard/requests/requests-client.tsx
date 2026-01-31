"use client";

import { useState } from "react";
import Link from "next/link";
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
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Building2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency } from "@/lib/utils";

type Request = {
  id: string;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  agreedRate: number | { toString: () => string } | null;
  role: string;
  counterparty: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  listing: {
    developer: {
      pseudonym: string;
      title: string;
      level: string;
      skills: Array<{
        skill: { name: string };
        isPrimary: boolean;
      }>;
    };
  };
  conversation?: {
    messages: Array<{
      content: string;
      createdAt: Date | string;
    }>;
  } | null;
  updatedAt: Date | string;
};

type Counts = {
  all: number;
  pending: number;
  active: number;
  completed: number;
};

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING: { label: "Pending", color: "bg-yellow-500", icon: Clock },
  NEGOTIATING: { label: "Negotiating", color: "bg-orange-500", icon: Clock },
  OFFER_SENT: { label: "Offer Sent", color: "bg-indigo-500", icon: Clock },
  ACCEPTED: { label: "Accepted", color: "bg-blue-500", icon: CheckCircle },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-purple-500",
    icon: AlertCircle,
  },
  COMPLETED: { label: "Completed", color: "bg-green-500", icon: CheckCircle },
  REJECTED: { label: "Declined", color: "bg-red-500", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-500", icon: XCircle },
};

export function RequestsClient({
  initialRequests,
  counts,
}: {
  initialRequests: Request[];
  counts: Counts;
}) {
  const [activeTab, setActiveTab] = useState("all");

  const filteredRequests = initialRequests.filter((req) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return req.status === "PENDING";
    if (activeTab === "active")
      return ["ACCEPTED", "IN_PROGRESS"].includes(req.status);
    if (activeTab === "completed") return req.status === "COMPLETED";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary" className="ml-1">
              {counts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            <Badge variant="secondary" className="ml-1">
              {counts.pending}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            Active
            <Badge variant="secondary" className="ml-1">
              {counts.active}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            Completed
            <Badge variant="secondary" className="ml-1">
              {counts.completed}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredRequests.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestCard({ request }: { request: Request }) {
  const status = statusConfig[request.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  const rate = request.agreedRate
    ? typeof request.agreedRate === "number"
      ? request.agreedRate
      : parseFloat(request.agreedRate.toString())
    : null;

  const primarySkills = request.listing.developer.skills
    .filter((s) => s.isPrimary)
    .slice(0, 3);

  const lastMessage = request.conversation?.messages?.[0];
  const updatedAt = new Date(request.updatedAt);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Developer & Company Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`${status.color} text-white border-0`}
              >
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
              <Badge
                variant={request.role === "client" ? "default" : "secondary"}
              >
                {request.role === "client" ? "You're Hiring" : "Your Resource"}
              </Badge>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                {request.listing.developer.pseudonym}
              </h3>
              <p className="text-sm text-muted-foreground">
                {request.listing.developer.title} ·{" "}
                {request.listing.developer.level}
              </p>
            </div>

            <div className="flex flex-wrap gap-1">
              {primarySkills.map((s) => (
                <Badge
                  key={s.skill.name}
                  variant="secondary"
                  className="text-xs"
                >
                  {s.skill.name}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>
                {request.role === "client" ? "From" : "For"}:{" "}
                {request.counterparty.name}
              </span>
            </div>
          </div>

          {/* Center: Last Message Preview */}
          {lastMessage && (
            <div className="flex-1 hidden lg:block">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lastMessage.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm line-clamp-2">{lastMessage.content}</p>
              </div>
            </div>
          )}

          {/* Right: Rate & Actions */}
          <div className="flex flex-col items-end gap-3">
            {rate && (
              <div className="text-right">
                <p className="text-lg font-bold">{formatCurrency(rate)}/hr</p>
                <p className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}
                </p>
              </div>
            )}
            <Link href={`/dashboard/requests/${request.id}`}>
              <Button>
                View Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, { title: string; description: string }> = {
    all: {
      title: "No requests yet",
      description:
        "When you send or receive engagement requests, they'll appear here.",
    },
    pending: {
      title: "No pending requests",
      description: "All your requests have been reviewed.",
    },
    active: {
      title: "No active engagements",
      description: "You don't have any ongoing contracts at the moment.",
    },
    completed: {
      title: "No completed engagements",
      description: "Completed contracts will appear here for reference.",
    },
  };

  const msg = messages[tab] || messages.all;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4 mb-4">
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{msg.title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          {msg.description}
        </p>
        <Link href="/dashboard/market">
          <Button>Browse Marketplace</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
