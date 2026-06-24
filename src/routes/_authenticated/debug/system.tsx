import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { InsufficientPermissions } from "@/components/insufficient-permissions";
import { UserButton } from "@/components/User-button";
import { useMyRole } from "@/hooks/use-my-role";
import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/debug/system")({
  component: SystemDebugPage,
});

function SystemDebugPage() {
  const { hasPermission, isLoading: roleLoading } = useMyRole();
  const canQuery = !roleLoading && hasPermission("schema:read");
  const summary = useQuery(api.systemDebug.getSystemSummary, canQuery ? {} : "skip");
  const auditLog = useQuery(
    api.systemDebug.listRecentAuditLog,
    canQuery ? { paginationOpts: { numItems: 10, cursor: null } } : "skip",
  );
  const versionEvents = useQuery(
    api.systemDebug.listRecentVersionEvents,
    canQuery ? { paginationOpts: { numItems: 10, cursor: null } } : "skip",
  );
  const presence = useQuery(api.systemDebug.listPresenceSessions, canQuery ? {} : "skip");
  const media = useQuery(api.systemDebug.listMediaAssets, canQuery ? {} : "skip");
  const schemaVersions = useQuery(api.systemDebug.listSchemaVersions, canQuery ? {} : "skip");

  if (roleLoading) {
    return <div data-testid="debug-system-loading">Loading...</div>;
  }

  if (!hasPermission("schema:read")) {
    return <InsufficientPermissions requiredPermission="schema:read" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">System Debug</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Internal view of system tables (admin only)
          </p>
        </div>
        <UserButton />
      </header>

      <main data-testid="debug-system" className="mx-auto mt-8 w-full max-w-3xl flex-1 space-y-6">
        <section data-testid="debug-system-summary">
          <h2 className="text-sm font-medium">Table counts</h2>
          {summary === undefined ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading summary...</p>
          ) : (
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {Object.entries(summary).map(([table, count]) => (
                <div key={table} className="rounded-md border border-border px-3 py-2">
                  <dt className="text-muted-foreground">{table}</dt>
                  <dd className="font-mono text-lg" data-testid={`debug-count-${table}`}>
                    {count as number}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <DebugList
          title="Recent audit log"
          testId="debug-audit-log"
          loading={auditLog === undefined}
          empty={auditLog?.page.length === 0}
          items={auditLog?.page.map(
            (item: { action: string; resourceType: string; resourceId: string }) =>
              `${item.action} · ${item.resourceType}/${item.resourceId}`,
          )}
        />

        <DebugList
          title="Recent version events"
          testId="debug-version-events"
          loading={versionEvents === undefined}
          empty={versionEvents?.page.length === 0}
          items={versionEvents?.page.map(
            (item: { eventType: string; summary: string }) => `${item.eventType} · ${item.summary}`,
          )}
        />

        <DebugList
          title="Schema versions"
          testId="debug-schema-versions"
          loading={schemaVersions === undefined}
          empty={schemaVersions?.length === 0}
          items={schemaVersions?.map(
            (item: { version: number; changeSummary: string }) =>
              `v${item.version} · ${item.changeSummary}`,
          )}
        />

        <DebugList
          title="Presence sessions"
          testId="debug-presence"
          loading={presence === undefined}
          empty={presence?.length === 0}
          items={presence?.map(
            (item: { routePath: string; userId: string }) =>
              `${item.routePath} · user ${item.userId}`,
          )}
        />

        <DebugList
          title="Media assets"
          testId="debug-media"
          loading={media === undefined}
          empty={media?.length === 0}
          items={media?.map(
            (item: { filename: string; mimeType: string }) => `${item.filename} (${item.mimeType})`,
          )}
        />
      </main>
    </div>
  );
}

function DebugList({
  title,
  testId,
  loading,
  empty,
  items,
}: {
  title: string;
  testId: string;
  loading: boolean;
  empty?: boolean;
  items?: string[];
}) {
  return (
    <section data-testid={testId}>
      <h2 className="text-sm font-medium">{title}</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {loading ? (
          <li className="text-muted-foreground">Loading...</li>
        ) : empty ? (
          <li className="text-muted-foreground">No records</li>
        ) : (
          items?.map((item) => (
            <li
              key={item}
              className="rounded-md border border-border px-3 py-1.5 font-mono text-xs"
            >
              {item}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
