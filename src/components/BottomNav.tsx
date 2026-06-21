import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { bottomNavItems, navItemsForPermissions } from "@/config/navigation";
import { useMyRole } from "@/hooks/use-my-role";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { permissions } = useMyRole();
  const [mounted, setMounted] = useState(false);
  const visibleNavItems = permissions
    ? navItemsForPermissions(permissions)
    : bottomNavItems.filter((item) => !item.requiredPermission);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isActive = (href: (typeof visibleNavItems)[number]["href"]) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="sticky bottom-6 left-0 right-0 z-50 mt-auto flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 p-2 backdrop-blur-[80px]">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              viewTransition
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "p-3 transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
                active ? item.color : "hover:bg-white/10",
              )}
            >
              <span className="sr-only">{item.label}</span>
              <Icon
                className={cn(
                  "h-5 w-5 text-white transition-colors",
                  active ? item.darkColor : "text-white",
                )}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
