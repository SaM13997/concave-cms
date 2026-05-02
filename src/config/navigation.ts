import type { LucideIcon } from "lucide-react";
import { Home } from "lucide-react";

export type BottomNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  color: string;
  darkColor: string;
};

export const bottomNavItems: BottomNavItem[] = [
  {
    href: "/app",
    label: "Home",
    icon: Home,
    color: "bg-cyan-500/10",
    darkColor: "text-cyan-400",
  },
] as const;
