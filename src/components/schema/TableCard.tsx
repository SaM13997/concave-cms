import { Link } from "@tanstack/react-router";
import { ChevronRight, Layers } from "lucide-react";
import type { SchemaTable } from "@/lib/schema/live";
import { cn } from "@/lib/utils";

type TableCardProps = {
  table: SchemaTable;
  className?: string;
};

function formatUpdatedAt(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function TableCard({ table, className }: TableCardProps) {
  const requiredCount = table.fields.filter((field) => field.required).length;
  const fieldTypes = [...new Set(table.fields.map((field) => field.type))].slice(0, 4);
  const statusTone =
    table.status === "active"
      ? "bg-secondary text-secondary-foreground"
      : table.status === "archived"
        ? "bg-muted text-muted-foreground"
        : "bg-accent text-accent-foreground";

  return (
    <Link
      to="/schema/$tableId"
      params={{ tableId: table.slug }}
      className={cn(
        "group block rounded-2xl border border-border bg-card p-5 shadow-xs transition-all",
        "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <Layers className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight text-card-foreground">
              {table.name}
            </h3>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{table.slug}</p>
            {table.description ? (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{table.description}</p>
            ) : null}
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone}`}>
          {table.status}
        </span>
        {table.locked ? (
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            locked
          </span>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {fieldTypes.length > 0 ? (
          fieldTypes.map((type) => (
            <span
              key={type}
              className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
            >
              {type}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
            Ready for fields
          </span>
        )}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {table.fields.length} field{table.fields.length === 1 ? "" : "s"}
          {requiredCount > 0 ? ` / ${requiredCount} required` : ""}
        </span>
        <span>Updated {formatUpdatedAt(table.updatedAt)}</span>
      </div>
    </Link>
  );
}
