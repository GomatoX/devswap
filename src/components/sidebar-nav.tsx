"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  DollarSign,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Bench", href: "/dashboard/bench", icon: Briefcase },
  { name: "Marketplace", href: "/dashboard/market", icon: Store },
  { name: "Requests", href: "/dashboard/requests", icon: MessageSquare },
];

const engagementTools: NavItem[] = [
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Contracts", href: "/dashboard/contracts", icon: FileCheck },
  { name: "Timesheets", href: "/dashboard/timesheets", icon: Clock },
  { name: "Invoices", href: "/dashboard/invoices", icon: Receipt },
];

const adminTools: NavItem[] = [
  { name: "Admin Panel", href: "/dashboard/admin", icon: Shield },
  { name: "Plans", href: "/dashboard/admin/plans", icon: DollarSign },
];

const bottomNavigation: NavItem[] = [
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarNavProps {
  isAdmin: boolean;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  // Exact match for: /dashboard, /dashboard/admin (parent routes)
  // StartsWith match for others (e.g., /dashboard/bench, /dashboard/requests)
  const exactMatchRoutes = ["/dashboard", "/dashboard/admin"];
  const isActive = exactMatchRoutes.includes(item.href)
    ? pathname === item.href
    : pathname.startsWith(item.href);

  return (
    <Link href={item.href}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </Button>
    </Link>
  );
}

export function SidebarNav({ isAdmin }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} pathname={pathname} />
          ))}

          {/* Engagement Tools */}
          <Separator className="my-4" />
          <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Engagement
          </div>
          {engagementTools.map((item) => (
            <NavLink key={item.name} item={item} pathname={pathname} />
          ))}

          {/* Admin Tools */}
          {isAdmin && (
            <>
              <Separator className="my-4" />
              <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Admin
              </div>
              {adminTools.map((item) => (
                <NavLink key={item.name} item={item} pathname={pathname} />
              ))}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="border-t p-3">
        {bottomNavigation.map((item) => (
          <NavLink key={item.name} item={item} pathname={pathname} />
        ))}
      </div>
    </>
  );
}
