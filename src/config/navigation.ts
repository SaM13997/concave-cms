import type { LucideIcon } from "lucide-react";
import { Bug, ClipboardList, FileText, Home, Image, Layers, Radio, Settings } from "lucide-react";
import type { Permission } from "../../convex/lib/permissions";

export type BottomNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  color: string;
  darkColor: string;
  requiredPermission?: Permission;
};

export const bottomNavItems: BottomNavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    color: "bg-cyan-500/10",
    darkColor: "text-cyan-400",
  },
  {
    href: "/content",
    label: "Content",
    icon: FileText,
    color: "bg-emerald-500/10",
    darkColor: "text-emerald-400",
    requiredPermission: "content:read",
  },
  {
    href: "/media",
    label: "Media",
    icon: Image,
    color: "bg-orange-500/10",
    darkColor: "text-orange-400",
    requiredPermission: "content:read",
  },
  {
    href: "/schema",
    label: "Schema",
    icon: Layers,
    color: "bg-violet-500/10",
    darkColor: "text-violet-400",
    requiredPermission: "schema:read",
  },
  {
    href: "/audit",
    label: "Audit",
    icon: ClipboardList,
    color: "bg-sky-500/10",
    darkColor: "text-sky-400",
    requiredPermission: "schema:read",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    color: "bg-slate-500/10",
    darkColor: "text-slate-400",
    requiredPermission: "schema:read",
  },
  {
    href: "/debug/system",
    label: "Debug",
    icon: Bug,
    color: "bg-amber-500/10",
    darkColor: "text-amber-400",
    requiredPermission: "schema:read",
  },
  {
    href: "/debug/reactive",
    label: "Live",
    icon: Radio,
    color: "bg-rose-500/10",
    darkColor: "text-rose-400",
    requiredPermission: "content:read",
  },
] as const;

export type PermissionGated = {
  requiredPermission?: Permission;
};

export function itemsForPermissions<T extends PermissionGated>(
  items: readonly T[],
  permissions: readonly Permission[],
): T[] {
  return items.filter(
    (item) => !item.requiredPermission || permissions.includes(item.requiredPermission),
  );
}

export function navItemsForPermissions(permissions: readonly Permission[]): BottomNavItem[] {
  return itemsForPermissions(bottomNavItems, permissions);
}

export type DashboardSection = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
};

export const dashboardSections: DashboardSection[] = [
  {
    icon: Layers,
    title: "Content Types",
    description: "Define and manage your content schemas",
    href: "/schema",
    requiredPermission: "schema:read",
  },
  {
    icon: FileText,
    title: "Content Entries",
    description: "Create, edit, and publish content",
    href: "/content",
    requiredPermission: "content:read",
  },
  {
    icon: Image,
    title: "Media Library",
    description: "Upload and organize your assets",
    href: "/media",
    requiredPermission: "content:read",
  },
  {
    icon: Settings,
    title: "Settings",
    description: "Configure your CMS instance",
    href: "/settings",
    requiredPermission: "schema:read",
  },
];

export function dashboardSectionsForPermissions(
  permissions: readonly Permission[],
): DashboardSection[] {
  return itemsForPermissions(dashboardSections, permissions);
}
