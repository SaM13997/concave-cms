import { useRouterState } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { type BreadcrumbItem, Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { CommandPalette, useCommandPalette } from "@/components/admin/CommandPalette";
import { PresenceIndicator } from "@/components/admin/PresenceIndicator";
import { useGlobalKeyboardShortcuts } from "@/hooks/use-keyboard-navigation";
import { authClient } from "@/lib/auth-client";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

function useBreadcrumbItems(): BreadcrumbItem[] {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  });

  const entryId =
    typeof search.entry === "string" ? (search.entry as Id<"contentEntries">) : undefined;
  const contentType = typeof search.type === "string" ? search.type : undefined;
  const schemaTable = typeof search.table === "string" ? search.table : undefined;
  const { data: session } = authClient.useSession();

  const entrySummary = useQuery(
    api.navigation.getContentEntryNavSummary,
    entryId && session?.session ? { entryId } : "skip",
  );

  const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  if (pathname === "/content" || pathname.startsWith("/content")) {
    if (entryId && entrySummary && contentType) {
      items.push({ label: "Content", href: "/content" });
      items.push({
        label: entrySummary.contentTypeName,
        href: `/content?type=${contentType}`,
      });
      items.push({ label: entrySummary.title });
    } else {
      items.push({ label: "Content" });
    }
  } else if (pathname === "/schema") {
    items.push({ label: "Schema", href: "/schema" });
    if (schemaTable) {
      items.push({ label: schemaTable });
    }
  } else if (pathname === "/media") {
    items.push({ label: "Media" });
  } else if (pathname === "/audit") {
    items.push({ label: "Audit" });
  } else if (pathname === "/settings") {
    items.push({ label: "Settings" });
  } else if (pathname.startsWith("/debug")) {
    items.push({ label: "Debug", href: "/debug/system" });
    if (pathname.includes("reactive")) {
      items.push({ label: "Live demo" });
    } else {
      items.push({ label: "System" });
    }
  }

  return items;
}

export function AdminChrome({ children }: { children: ReactNode }) {
  const breadcrumbs = useBreadcrumbItems();
  const { open, setOpen } = useCommandPalette();
  useGlobalKeyboardShortcuts();

  return (
    <>
      <div
        data-testid="admin-chrome"
        className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Breadcrumbs items={breadcrumbs} />
          <div className="flex items-center gap-3">
            <PresenceIndicator />
            <button
              type="button"
              data-testid="command-palette-trigger"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="rounded border border-border px-1 text-[10px]">⌘K</kbd>
            </button>
          </div>
        </div>
      </div>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
