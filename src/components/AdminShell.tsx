import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { UserButton } from "@/components/User-button";
import { adminNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <div className="flex min-h-[calc(100lvh-6rem)] flex-col bg-background lg:flex-row">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card/40 lg:block">
        <div className="sticky top-0 flex h-full flex-col px-3 py-6">
          <Link to="/" className="mb-6 px-3 text-sm font-semibold tracking-tight text-foreground">
            Concave CMS
          </Link>
          <nav aria-label="Admin navigation" className="flex flex-1 flex-col gap-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground lg:hidden">Concave CMS</p>
          <UserButton />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
