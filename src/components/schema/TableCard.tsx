import { Link } from "@tanstack/react-router";
import { ChevronRight, Layers } from "lucide-react";
import type { SchemaTable } from "@/lib/mock/schema";
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
  return (
    <Link
      to="/schema/$tableId"
      params={{ tableId: table.id }}
      className={cn(
        "group block rounded-lg border border-border bg-card p-5 transition-colors",
        "hover:border-muted-foreground/30 hover:bg-accent/20",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
            <Layers className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-card-foreground">{table.name}</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{table.slug}</p>
            {table.description ? (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{table.description}</p>
            ) : null}
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {table.fields.length} field{table.fields.length === 1 ? "" : "s"}
        </span>
        <span>Updated {formatUpdatedAt(table.updatedAt)}</span>
      </div>
    </Link>
  );
}
