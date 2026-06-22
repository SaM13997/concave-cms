import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Image,
  Layers,
  LayoutDashboard,
  Rocket,
  ScrollText,
  Settings,
} from "lucide-react";
import { isAdminRole, type UserRole } from "@/lib/roles";

export type AdminNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Hidden for editor role when true. BLOCKER(BE-001): enforce server-side too. */
  adminOnly?: boolean;
};

export const adminNavItems: AdminNavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/content",
    label: "Content",
    icon: FileText,
  },
  {
    href: "/schema",
    label: "Schema",
    icon: Layers,
    adminOnly: true,
  },
  {
    href: "/media",
    label: "Media",
    icon: Image,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    adminOnly: true,
  },
  {
    href: "/audit",
    label: "Audit",
    icon: ScrollText,
    adminOnly: true,
  },
  {
    href: "/onboarding",
    label: "Onboarding",
    icon: Rocket,
  },
] as const;

export function filterAdminNavByRole(role: UserRole): AdminNavItem[] {
  if (isAdminRole(role)) {
    return adminNavItems;
  }

  return adminNavItems.filter((item) => !item.adminOnly);
}

/** @deprecated Mobile bottom nav — superseded by admin sidebar. */
export type BottomNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  color: string;
  darkColor: string;
};

/** @deprecated Use adminNavItems in authenticated shell. */
export const bottomNavItems: BottomNavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "bg-cyan-500/10",
    darkColor: "text-cyan-400",
  },
] as const;

export const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/content": "Content",
  "/schema": "Schema",
  "/media": "Media",
  "/settings": "Settings",
  "/audit": "Audit",
  "/onboarding": "Onboarding",
};

export function getRouteLabel(pathname: string): string {
  if (routeLabels[pathname]) {
    return routeLabels[pathname];
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "Dashboard";
  }

  return segments[segments.length - 1]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
