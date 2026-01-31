import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import {
  Briefcase,
  Store,
  MessageSquare,
  Settings,
  LayoutDashboard,
  Shield,
  CreditCard,
  BarChart3,
  FileCheck,
  Clock,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationDropdown } from "./notifications/notification-dropdown";
import { SubscriptionGate } from "@/components/subscription-gate";
import { checkSubscription } from "@/lib/subscription";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Bench", href: "/dashboard/bench", icon: Briefcase },
  { name: "Marketplace", href: "/dashboard/market", icon: Store },
  { name: "Requests", href: "/dashboard/requests", icon: MessageSquare },
];

const engagementTools = [
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Contracts", href: "/dashboard/contracts", icon: FileCheck },
  { name: "Timesheets", href: "/dashboard/timesheets", icon: Clock },
  { name: "Invoices", href: "/dashboard/invoices", icon: Receipt },
];

const bottomNavigation = [
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.isAdmin === true;

  // Check subscription status
  const subscription = await checkSubscription();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-muted/30 md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              DS
            </div>
            <span className="text-xl font-bold">DevSwap</span>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            ))}

            {/* Engagement Tools */}
            <Separator className="my-4" />
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Engagement
            </div>
            {engagementTools.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            ))}

            {isAdmin && (
              <>
                <Separator className="my-4" />
                <Link href="/dashboard/admin">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                  >
                    <Shield className="h-5 w-5" />
                    Admin Panel
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Admin
                    </Badge>
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className="border-t p-3">
          {bottomNavigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          {/* Mobile Menu Button (placeholder) */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <LayoutDashboard className="h-5 w-5" />
            </Button>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden md:block" />

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <SubscriptionGate
              isActive={subscription.isActive}
              tier={subscription.tier}
            >
              {children}
            </SubscriptionGate>
          </div>
        </main>
      </div>
    </div>
  );
}
