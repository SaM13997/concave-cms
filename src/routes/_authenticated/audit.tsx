import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { InsufficientPermissions } from "@/components/insufficient-permissions";
import { useMyRole } from "@/hooks/use-my-role";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_authenticated/audit")({
  component: AuditLogPage,
});

const ACTION_LABELS: Record<string, string> = {
  "schema.create": "Schema created",
  "schema.update": "Schema updated",
  "schema.apply": "Schema applied",
  "content.create": "Content created",
  "content.update": "Content updated",
  "content.publish": "Content published",
  "content.revert": "Content reverted",
  "media.upload": "Media uploaded",
  "presence.heartbeat": "Presence heartbeat",
};

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function AuditLogPage() {
  const { hasPermission, isLoading: roleLoading } = useMyRole();
  const canViewAudit = !roleLoading && hasPermission("schema:read");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<Id<"auditLog"> | null>(null);

  const actions = useQuery(api.auditLog.listAuditActions, canViewAudit ? {} : "skip");
  const selectedEntry = useQuery(
    api.auditLog.getAuditLogEntry,
    canViewAudit && selectedId ? { auditLogId: selectedId } : "skip",
  );

  const { results, status, loadMore } = usePaginatedQuery(
    api.auditLog.listAuditLog,
    canViewAudit
      ? {
          action: actionFilter ? (actionFilter as never) : undefined,
          resourceType: resourceTypeFilter || undefined,
        }
      : "skip",
    { initialNumItems: 25 },
  );

  const resourceTypes = useMemo(() => {
    const types = new Set<string>();
    for (const entry of results ?? []) {
      types.add(entry.resourceType);
    }
    return [...types].sort();
  }, [results]);

  if (roleLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading audit log…</div>;
  }

  if (!hasPermission("schema:read")) {
    return <InsufficientPermissions requiredPermission="schema:read" />;
  }

  return (
    <AdminPageLayout
      title="Audit log"
      description="Review security-sensitive actions across the CMS."
      stacked
      contentClassName="flex flex-col gap-6"
    >
      <section
        data-testid="audit-log-filters"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Action</span>
          <select
            data-testid="audit-filter-action"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="">All actions</option>
            {(actions ?? []).map((action) => (
              <option key={action} value={action}>
                {ACTION_LABELS[action] ?? action}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Resource type</span>
          <select
            data-testid="audit-filter-resource-type"
            value={resourceTypeFilter}
            onChange={(event) => setResourceTypeFilter(event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="">All resources</option>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section data-testid="audit-log-viewer" className="rounded-lg border border-border bg-card">
        {results === undefined ? (
          <p className="p-6 text-sm text-muted-foreground">Loading audit events…</p>
        ) : results.length === 0 ? (
          <p data-testid="audit-log-empty" className="p-6 text-sm text-muted-foreground">
            No audit events match the current filters.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {results.map((entry) => (
              <li key={entry._id}>
                <button
                  type="button"
                  data-testid={`audit-log-entry-${entry._id}`}
                  onClick={() => setSelectedId(entry._id)}
                  className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                    <time className="text-xs text-muted-foreground">
                      {formatTimestamp(entry.timestamp)}
                    </time>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.actorName} · {entry.resourceType}/{entry.resourceId}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {status === "CanLoadMore" && (
          <div className="border-t border-border p-4">
            <button
              type="button"
              data-testid="audit-log-load-more"
              onClick={() => loadMore(25)}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Load more
            </button>
          </div>
        )}
      </section>

      {selectedEntry && (
        <section
          data-testid="audit-log-detail"
          className="rounded-lg border border-border bg-card p-4"
          aria-live="polite"
        >
          <h2 className="text-sm font-medium">Event detail</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Action</dt>
              <dd>{ACTION_LABELS[selectedEntry.action] ?? selectedEntry.action}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Actor</dt>
              <dd>
                {selectedEntry.actorName} ({selectedEntry.actorEmail})
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Resource</dt>
              <dd>
                {selectedEntry.resourceType}/{selectedEntry.resourceId}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Metadata</dt>
              <dd>
                <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(selectedEntry.metadata, null, 2)}
                </pre>
              </dd>
            </div>
          </dl>
        </section>
      )}
    </AdminPageLayout>
  );
}
