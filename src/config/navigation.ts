import type { LucideIcon } from "lucide-react";
import { Bug, FileText, Home, Layers, Radio } from "lucide-react";
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
    href: "/schema",
    label: "Schema",
    icon: Layers,
    color: "bg-violet-500/10",
    darkColor: "text-violet-400",
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

export function navItemsForPermissions(permissions: readonly Permission[]): BottomNavItem[] {
  return bottomNavItems.filter(
    (item) => !item.requiredPermission || permissions.includes(item.requiredPermission),
  );
}
