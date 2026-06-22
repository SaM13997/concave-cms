import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useCmsUser, useUserRole } from "@/components/CmsUserProvider";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type AuditResourceType, formatAuditTimestamp } from "@/lib/audit/live";
import { api, usePaginatedQuery } from "@/lib/convex/hooks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/audit/")({
  component: AuditLogPage,
});

const resourceTypeFilters: Array<{ value: AuditResourceType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "content", label: "Content" },
  { value: "schema", label: "Schema" },
  { value: "media", label: "Media" },
  { value: "settings", label: "Settings" },
  { value: "auth", label: "Auth" },
];

function AuditLogPage() {
  const [query, setQuery] = useState("");
  const [resourceType, setResourceType] = useState<AuditResourceType | "all">("all");
  const [actor, setActor] = useState("");
  const me = useCmsUser();
  const role = useUserRole();
  const auditQuery = usePaginatedQuery(
    api.auditLog.list,
    role === "admin"
      ? {
          query: query.trim() || undefined,
          resourceType: resourceType === "all" ? undefined : resourceType,
          actorEmail: actor.trim() || undefined,
        }
      : "skip",
    { initialNumItems: 50 },
  );

  return (
    <div className="app-grid">
      <section className="app-panel rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
        <PageHeader
          eyebrow="Audit trail"
          title="Every schema, content, media, and auth action in one review surface."
          description="Operators need a readable event stream, not just raw logs. This live view supports triage, actor filtering, and quick checks across the backend activity trail."
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(18rem,1fr)]">
        <section className="app-grid">
          <div className="app-panel-soft rounded-[1.8rem] px-5 py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search actions, resources, or details..."
                  className="h-11 rounded-full border-white/70 bg-white/80 pl-10"
                  aria-label="Search audit events"
                />
              </div>
              <div className="space-y-2 lg:w-56">
                <label
                  htmlFor="audit-actor"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Actor email
                </label>
                <Input
                  id="audit-actor"
                  value={actor}
                  onChange={(event) => setActor(event.target.value)}
                  placeholder="Filter by email..."
                  className="h-11 rounded-full border-white/70 bg-white/80"
                />
              </div>
            </div>

            <fieldset className="mt-4 flex flex-wrap gap-2">
              <legend className="sr-only">Filter by resource type</legend>
              {resourceTypeFilters.map((filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  size="sm"
                  variant={resourceType === filter.value ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setResourceType(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </fieldset>
          </div>

          {me === undefined ? (
            <div className="app-panel rounded-[1.8rem] px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">Loading audit access...</p>
            </div>
          ) : role !== "admin" ? (
            <EmptyState
              icon={ShieldCheck}
              title="Admin access required"
              description="Audit history is available to administrators so the event trail stays appropriately scoped."
            />
          ) : auditQuery.isLoading && auditQuery.results.length === 0 ? (
            <div className="app-panel rounded-[1.8rem] px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">Loading audit events...</p>
            </div>
          ) : auditQuery.results.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No audit events"
              description="No events match your current filters."
            />
          ) : (
            <div className="app-panel overflow-hidden rounded-[1.8rem]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/55">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">
                        Time
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">
                        Actor
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">
                        Action
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">
                        Resource
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditQuery.results.map((event) => (
                      <tr key={event._id} className="bg-white/78 hover:bg-muted/30">
                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                          {formatAuditTimestamp(event.timestamp)}
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-foreground">{event.actorName}</p>
                            <p className="text-xs text-muted-foreground">{event.actorEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <code className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
                            {event.action}
                          </code>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                                "bg-secondary text-secondary-foreground",
                              )}
                            >
                              {event.resourceType}
                            </span>
                            <span className="font-mono text-xs text-foreground">
                              {event.resource}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{event.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {me?.role === "admin" && auditQuery.status !== "Exhausted" ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                disabled={auditQuery.status !== "CanLoadMore"}
                onClick={() => auditQuery.loadMore(50)}
              >
                {auditQuery.status === "LoadingMore" ? "Loading more..." : "Load more events"}
              </Button>
            </div>
          ) : null}
        </section>

        <aside className="app-grid">
          <section className="app-panel-soft rounded-[1.8rem] px-5 py-5">
            <p className="app-kicker">Why it matters</p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">
              Time travel starts with trustworthy event capture.
            </h2>
            <div className="mt-5 rounded-[1.35rem] bg-white/78 px-4 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-secondary">
                  <ShieldCheck className="size-4 text-secondary-foreground" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Operator confidence</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    A readable event stream makes compare, revert, and compliance workflows much
                    easier to reason about.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="app-panel rounded-[1.8rem] px-5 py-5">
            <p className="app-kicker">Coverage</p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">
              Content, schema, media, settings, and auth are already modeled.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The operator-facing event stream is live now, with server-side access control still
              enforcing who can read it.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
