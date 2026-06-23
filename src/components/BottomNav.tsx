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
      <nav
        aria-label="Primary"
        className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/10 p-1.5 backdrop-blur-[80px] [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 sm:p-2 [&::-webkit-scrollbar]:hidden"
      >
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              viewTransition
              aria-current={active ? "page" : undefined}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "shrink-0 rounded-full p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:p-3",
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
      </nav>
    </div>
  );
}
