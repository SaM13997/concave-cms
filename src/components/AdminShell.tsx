import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";
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
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar/80 lg:block">
        <div className="sticky top-0 flex h-full flex-col px-4 py-5">
          <Link
            to="/"
            className="mb-5 flex items-center gap-2 px-2 text-sm font-semibold tracking-tight text-sidebar-foreground"
          >
            <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            Concave
          </Link>
          <Link
            to="/schema"
            className="mb-5 flex items-center gap-2 rounded-xl border border-sidebar-border bg-card px-3 py-2.5 text-sm text-muted-foreground shadow-xs transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="flex-1">Find content or schema</span>
            <kbd className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Cmd K
            </kbd>
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
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="rounded-2xl border border-sidebar-border bg-card p-3 shadow-xs">
            <p className="text-xs font-medium text-foreground">Fast path</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Create a collection, choose starter fields, then export the Convex-ready shape.
            </p>
            <Link
              to="/schema"
              className="mt-3 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Open builder
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-muted-foreground lg:hidden">Concave</p>
          <UserButton />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">{children}</main>
      </div>
    </div>
  );
}
