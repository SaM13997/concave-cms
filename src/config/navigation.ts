import type { LucideIcon } from "lucide-react";
import { Bug, ClipboardList, FileText, Home, Image, Layers, Radio, Settings } from "lucide-react";
import type { Permission } from "../../convex/lib/permissions";

const ADMIN_PERMISSION: Permission = "schema:write";

export type BottomNavItem = PermissionGated & {
  href: string;
  icon: LucideIcon;
  label: string;
  color: string;
  darkColor: string;
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
    requiresAdmin: true,
  },
  // Debug/Live are hidden from bottom nav for non-admins (requiresAdmin). Cmd+K global search
  // and direct URLs (/debug/system, /debug/reactive) are unchanged — those routes enforce
  // their own page-level permission checks, not bottom-nav visibility.
  {
    href: "/debug/system",
    label: "Debug",
    icon: Bug,
    color: "bg-amber-500/10",
    darkColor: "text-amber-400",
    requiresAdmin: true,
  },
  {
    href: "/debug/reactive",
    label: "Live",
    icon: Radio,
    color: "bg-rose-500/10",
    darkColor: "text-rose-400",
    requiresAdmin: true,
  },
];

export type PermissionGated = {
  requiredPermission?: Permission;
  /** Settings, debug tools, and exports are admin-only; maps to admin role via schema:write permission. */
  requiresAdmin?: boolean;
};

export function hasAdminAccess(permissions: readonly Permission[]): boolean {
  return permissions.includes(ADMIN_PERMISSION);
}

/** Items visible before role permissions load (no permission or admin gate). */
export function isPublicNavItem(item: PermissionGated): boolean {
  return !item.requiredPermission && !item.requiresAdmin;
}

export function itemsForPermissions<T extends PermissionGated>(
  items: readonly T[],
  permissions: readonly Permission[],
): T[] {
  return items.filter((item) => {
    if (item.requiresAdmin && !hasAdminAccess(permissions)) {
      return false;
    }
    return !item.requiredPermission || permissions.includes(item.requiredPermission);
  });
}

export function navItemsForPermissions(permissions: readonly Permission[]): BottomNavItem[] {
  return itemsForPermissions(bottomNavItems, permissions);
}

export type DashboardSection = PermissionGated & {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
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
    requiresAdmin: true,
  },
];

export function dashboardSectionsForPermissions(
  permissions: readonly Permission[],
): DashboardSection[] {
  return itemsForPermissions(dashboardSections, permissions);
}
