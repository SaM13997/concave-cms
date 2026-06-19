export type AuditResourceType = "schema" | "content" | "media" | "settings" | "auth";

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceType: AuditResourceType;
  details: string;
  ipAddress: string;
};

export const mockAuditEvents: AuditEvent[] = [
  {
    id: "audit_001",
    timestamp: "2026-06-18T10:42:00Z",
    actor: "Alex Chen",
    actorEmail: "alex@concave.dev",
    action: "content.publish",
    resource: "posts/welcome-to-concave",
    resourceType: "content",
    details: "Published draft to production",
    ipAddress: "192.168.1.42",
  },
  {
    id: "audit_002",
    timestamp: "2026-06-18T09:15:00Z",
    actor: "Jordan Lee",
    actorEmail: "jordan@example.com",
    action: "content.update",
    resource: "posts/getting-started",
    resourceType: "content",
    details: "Updated title and body fields",
    ipAddress: "10.0.0.18",
  },
  {
    id: "audit_003",
    timestamp: "2026-06-17T16:30:00Z",
    actor: "Alex Chen",
    actorEmail: "alex@concave.dev",
    action: "schema.field.add",
    resource: "tables/posts",
    resourceType: "schema",
    details: "Added richText field 'excerpt'",
    ipAddress: "192.168.1.42",
  },
  {
    id: "audit_004",
    timestamp: "2026-06-17T14:00:00Z",
    actor: "Sam Rivera",
    actorEmail: "sam@example.com",
    action: "auth.login",
    resource: "session",
    resourceType: "auth",
    details: "Successful sign-in via email",
    ipAddress: "172.16.0.5",
  },
  {
    id: "audit_005",
    timestamp: "2026-06-16T11:22:00Z",
    actor: "Alex Chen",
    actorEmail: "alex@concave.dev",
    action: "settings.export",
    resource: "export/content-json",
    resourceType: "settings",
    details: "Exported all content entries as JSON",
    ipAddress: "192.168.1.42",
  },
  {
    id: "audit_006",
    timestamp: "2026-06-15T08:45:00Z",
    actor: "Jordan Lee",
    actorEmail: "jordan@example.com",
    action: "media.upload",
    resource: "media/team-photo.png",
    resourceType: "media",
    details: "Uploaded image asset (512 KB)",
    ipAddress: "10.0.0.18",
  },
  {
    id: "audit_007",
    timestamp: "2026-06-14T17:10:00Z",
    actor: "Alex Chen",
    actorEmail: "alex@concave.dev",
    action: "schema.table.create",
    resource: "tables/authors",
    resourceType: "schema",
    details: "Created content type 'Authors'",
    ipAddress: "192.168.1.42",
  },
  {
    id: "audit_008",
    timestamp: "2026-06-13T13:55:00Z",
    actor: "Sam Rivera",
    actorEmail: "sam@example.com",
    action: "content.revert",
    resource: "posts/feature-announcement",
    resourceType: "content",
    details: "Reverted to version 3",
    ipAddress: "172.16.0.5",
  },
];

export type AuditFilters = {
  query: string;
  resourceType: AuditResourceType | "all";
  actor: string;
};

export function filterAuditEvents(events: AuditEvent[], filters: AuditFilters): AuditEvent[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return events.filter((event) => {
    const matchesType =
      filters.resourceType === "all" || event.resourceType === filters.resourceType;
    const matchesActor =
      !filters.actor || event.actor.toLowerCase().includes(filters.actor.toLowerCase());

    if (!matchesType || !matchesActor) return false;
    if (!normalizedQuery) return true;

    return (
      event.action.toLowerCase().includes(normalizedQuery) ||
      event.resource.toLowerCase().includes(normalizedQuery) ||
      event.details.toLowerCase().includes(normalizedQuery) ||
      event.actor.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function formatAuditTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
