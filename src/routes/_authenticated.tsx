import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Menu, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { CmsUserProvider, useUserRole } from "@/components/CmsUserProvider";
import { CommandPalette } from "@/components/CommandPalette";
import { SchemaProvider } from "@/components/schema/SchemaProvider";
import { UserButton } from "@/components/User-button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { filterAdminNavByRole, getRouteLabel } from "@/config/navigation";
import { getAppEnvironment, shouldShowEnvBanner } from "@/lib/env";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    if (!context.userId) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedShell,
});

function AuthenticatedShell() {
  return (
    <CmsUserProvider>
      <AuthenticatedLayout />
    </CmsUserProvider>
  );
}

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const commandShortcutLabel = "Cmd/Ctrl K";

  const role = useUserRole();
  const navItems = filterAdminNavByRole(role);
  const env = getAppEnvironment();
  const showEnvBanner = shouldShowEnvBanner();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return [{ label: "Dashboard" }];
    }

    const crumbs: { label: string; href?: string }[] = [{ label: "Dashboard", href: "/" }];
    let currentPath = "";

    for (const segment of segments) {
      currentPath += `/${segment}`;
      crumbs.push({
        label: getRouteLabel(currentPath),
        href: currentPath,
      });
    }

    const last = crumbs[crumbs.length - 1];
    if (last) {
      delete last.href;
    }

    return crumbs;
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinkClass = (href: string) =>
    cn(
      "group flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-medium transition-all",
      isActive(href)
        ? "border-border bg-white text-sidebar-accent-foreground shadow-[0_14px_32px_-28px_oklch(0.32_0.02_145/0.35)]"
        : "border-transparent text-sidebar-foreground/72 hover:border-border/70 hover:bg-white/70 hover:text-sidebar-accent-foreground",
    );

  const sidebarNav = (
    <nav className="flex flex-1 flex-col gap-1.5" aria-label="Admin">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={navLinkClass(item.href)}
            onClick={() => setMobileNavOpen(false)}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
            {item.adminOnly ? (
              <Badge
                variant="outline"
                className="ml-auto rounded-full border-border bg-white/70 px-2 py-0.5 text-[10px]"
              >
                Admin
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <SchemaProvider>
      <div className="app-shell min-h-screen text-foreground">
        <div className="flex min-h-screen">
          <aside className="hidden w-[19.5rem] shrink-0 border-r border-sidebar-border/80 bg-sidebar/70 lg:block">
            <div className="sticky top-0 flex h-screen flex-col gap-4 px-5 py-5">
              <Link
                to="/"
                className="app-panel-soft rounded-[1.75rem] px-4 py-4 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Convex-native CMS
                    </p>
                    <h1 className="mt-2 text-[1.8rem] font-semibold leading-none text-sidebar-foreground">
                      Concave
                    </h1>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-secondary-foreground">
                    {env}
                  </span>
                </div>
                <p className="mt-3 max-w-[15rem] text-sm leading-6 text-muted-foreground">
                  The admin surface for schema, draft, preview, and publish without the sync tax.
                </p>
              </Link>

              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="app-panel-soft flex items-center gap-3 rounded-[1.35rem] px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
              >
                <div className="flex size-9 items-center justify-center rounded-2xl bg-white text-foreground shadow-sm">
                  <Search className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Command Center</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Search content, schema, media, and history
                  </p>
                </div>
                <kbd className="rounded-full border border-border bg-white px-2 py-1 font-mono text-[10px] text-muted-foreground">
                  {commandShortcutLabel}
                </kbd>
              </button>

              <div className="app-panel rounded-[1.8rem] px-3 py-3">{sidebarNav}</div>

              <div className="app-panel-soft mt-auto rounded-[1.8rem] px-4 py-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Launch workflow
                </p>
                <h2 className="mt-2 text-lg font-semibold text-foreground">Zero-sync fast path</h2>
                <ol className="mt-4 space-y-3">
                  {[
                    "Shape a collection visually",
                    "Generate draft-safe content",
                    "Preview the live subscription path",
                    "Publish in one atomic handoff",
                  ].map((item, index) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-foreground shadow-sm">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-6 text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ol>
                <Link
                  to="/schema"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  Open schema builder
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            {showEnvBanner ? (
              <div
                className="border-b border-amber-400/35 bg-[color-mix(in_oklch,var(--accent)_65%,white)] px-4 py-2 text-center text-xs font-medium uppercase tracking-[0.08em] text-amber-950/70"
                data-blocker="BE-001"
              >
                {env} environment - data may not reflect production
              </div>
            ) : null}

            <header className="sticky top-0 z-40 border-b border-border/75 bg-background/88 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4 px-4 py-3.5 md:px-6 lg:px-8 xl:px-10">
                <div className="flex min-w-0 items-center gap-3">
                  <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-2xl lg:hidden"
                        aria-label="Open navigation"
                      >
                        <Menu className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="w-[21rem] border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
                    >
                      <div className="space-y-4 px-4 py-5">
                        <div className="app-panel-soft rounded-[1.5rem] px-4 py-4">
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Concave
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Schema-first content operations for Convex teams.
                          </p>
                        </div>
                        {sidebarNav}
                      </div>
                    </SheetContent>
                  </Sheet>

                  <div className="min-w-0">
                    <p className="app-kicker hidden sm:inline-flex">
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      Reactive by default
                    </p>
                    <Breadcrumb className="mt-2 min-w-0">
                      <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => {
                          const isLast = index === breadcrumbs.length - 1;
                          return (
                            <BreadcrumbItem key={`${crumb.label}-${index}`}>
                              {isLast || !crumb.href ? (
                                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                              ) : (
                                <BreadcrumbLink asChild>
                                  <Link to={crumb.href}>{crumb.label}</Link>
                                </BreadcrumbLink>
                              )}
                              {!isLast ? <BreadcrumbSeparator /> : null}
                            </BreadcrumbItem>
                          );
                        })}
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden rounded-full bg-white/80 pl-3 sm:inline-flex"
                    onClick={() => setCommandOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                    <span className="text-foreground">Search</span>
                    <kbd className="pointer-events-none rounded-full border border-border bg-muted px-2 py-1 font-mono text-[10px] font-medium text-muted-foreground">
                      {commandShortcutLabel}
                    </kbd>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-2xl sm:hidden"
                    aria-label="Open command palette"
                    onClick={() => setCommandOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <div className="hidden items-center gap-3 rounded-full border border-border bg-white/75 px-3 py-2 xl:flex">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Publish target
                      </p>
                      <p className="text-sm font-semibold text-foreground">Draft-safe staging</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-secondary-foreground">
                      live
                    </span>
                  </div>
                  <UserButton />
                </div>
              </div>
            </header>

            <main className="flex-1 px-4 pb-8 pt-6 md:px-6 lg:px-8 xl:px-10">
              <div className="mx-auto w-full max-w-[96rem] app-reveal">
                <Outlet />
              </div>
            </main>
          </div>
        </div>

        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      </div>
    </SchemaProvider>
  );
}
