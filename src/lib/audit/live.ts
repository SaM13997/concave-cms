export type AuditResourceType = "schema" | "content" | "media" | "settings" | "auth";

const auditTimestampFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatAuditTimestamp(value: number | string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return auditTimestampFormatter.format(date);
}
