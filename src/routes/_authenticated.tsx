import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Menu, Search } from "lucide-react";
import { useMemo, useState } from "react";
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
import { authClient } from "@/lib/auth-client";
import { getAppEnvironment, shouldShowEnvBanner } from "@/lib/env";
import { getMockRole } from "@/lib/mock/roles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    // BLOCKER(BE-001): Replace with server session validation + RBAC enforcement.
    if (!context.userId) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { data: sessionData } = authClient.useSession();
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const role = getMockRole(sessionData?.user.email);
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
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive(href)
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
    );

  const sidebarNav = (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin">
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
              <Badge variant="outline" className="ml-auto text-[10px]">
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
      <div className="flex min-h-screen bg-background text-foreground">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
          <div className="border-b border-sidebar-border px-4 py-4">
            <Link to="/" className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Concave CMS
            </Link>
            <p className="mt-0.5 text-xs text-sidebar-foreground/60">Convex-native headless CMS</p>
          </div>
          {sidebarNav}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {showEnvBanner ? (
            <div
              className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-200"
              data-blocker="BE-001"
            >
              {env.toUpperCase()} environment — data may not reflect production.
            </div>
          ) : null}

          <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-6">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
                <div className="border-b border-sidebar-border px-4 py-4">
                  <p className="text-sm font-semibold">Concave CMS</p>
                </div>
                {sidebarNav}
              </SheetContent>
            </Sheet>

            <Breadcrumb className="min-w-0 flex-1">
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

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden gap-2 sm:inline-flex"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span className="text-muted-foreground">Search</span>
                <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-block">
                  ⌘K
                </kbd>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="sm:hidden"
                aria-label="Open command palette"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
              <UserButton />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-6">
            <Outlet />
          </main>
        </div>

        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      </div>
    </SchemaProvider>
  );
}
