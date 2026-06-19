import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { BlockerNotice } from "@/components/BlockerNotice";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type AuditResourceType,
  filterAuditEvents,
  formatAuditTimestamp,
  mockAuditEvents,
} from "@/lib/mock/audit";
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

  const filteredEvents = useMemo(
    () => filterAuditEvents(mockAuditEvents, { query, resourceType, actor }),
    [query, resourceType, actor],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Audit Log"
        description="Review activity across schema, content, media, and settings."
      />

      {/* BLOCKER(BE-009): Audit log query requires Phase 8 backend */}
      <BlockerNotice
        blockerId="BE-009"
        message="Showing mock audit events. Live data requires the audit log query API (BE-009)."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search actions, resources, or details…"
            className="pl-9"
            aria-label="Search audit events"
          />
        </div>
        <div className="space-y-2 lg:w-48">
          <label htmlFor="audit-actor" className="text-xs font-medium text-muted-foreground">
            Actor
          </label>
          <Input
            id="audit-actor"
            value={actor}
            onChange={(event) => setActor(event.target.value)}
            placeholder="Filter by name…"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by resource type">
        {resourceTypeFilters.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            size="sm"
            variant={resourceType === filter.value ? "default" : "outline"}
            onClick={() => setResourceType(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No audit events"
          description="No events match your current filters."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
                  Time
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
                  Actor
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
                  Action
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
                  Resource
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="bg-card hover:bg-muted/20">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatAuditTimestamp(event.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{event.actor}</p>
                      <p className="text-xs text-muted-foreground">{event.actorEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{event.action}</code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                          "bg-muted text-muted-foreground",
                        )}
                      >
                        {event.resourceType}
                      </span>
                      <span className="font-mono text-xs text-foreground">{event.resource}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{event.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
