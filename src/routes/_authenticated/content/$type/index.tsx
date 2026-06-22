import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type EntryStatus,
  formatContentDate,
  getStatusLabel,
  mapSchemaToContentType,
} from "@/lib/content/live";
import { api, usePaginatedQuery, useQuery } from "@/lib/convex/hooks";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | EntryStatus;

export const Route = createFileRoute("/_authenticated/content/$type/")({
  component: EntriesListPage,
});

function StatusBadge({ status }: { status: EntryStatus }) {
  const styles: Record<EntryStatus, string> = {
    published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    draft: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    published_with_draft: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        styles[status],
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function EntriesListPage() {
  const { type } = Route.useParams();
  const schema = useQuery(api.schemas.getBySlug, { slug: type });
  const contentType = useMemo(() => (schema ? mapSchemaToContentType(schema) : null), [schema]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const entryQuery = usePaginatedQuery(
    api.entries.listByType,
    schema?.status === "active" ? { contentType: type } : "skip",
    { initialNumItems: 25 },
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return entryQuery.results.filter((entry) => {
      const status = entry.status;
      const matchesQuery =
        !normalizedQuery ||
        entry.title.toLowerCase().includes(normalizedQuery) ||
        entry._id.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [entryQuery.results, query, statusFilter]);

  if (schema === undefined) {
    return (
      <div className="rounded-lg border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">Loading content type...</p>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-base font-semibold text-foreground">Content type not found.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This route does not match a live schema yet.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link to="/content">Back to content</Link>
        </Button>
      </div>
    );
  }

  if (!contentType) {
    return null;
  }

  if (schema.status !== "active") {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-base font-semibold text-foreground">{schema.name} is not active yet.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Apply this schema in the schema builder before creating or editing live entries.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link to="/schema">Open schema builder</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="mb-2 text-xs text-muted-foreground">
            <Link to="/content" className="hover:text-foreground">
              Content
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">{contentType.name}</span>
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight">{contentType.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {contentType.description || "No description yet."}
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/content/$type/new" params={{ type: contentType.slug }}>
            <Plus className="size-4" />
            Create entry
          </Link>
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            placeholder="Search entries..."
            className="pl-9"
            aria-label="Search entries"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <fieldset className="flex flex-wrap gap-1.5 border-0 p-0">
          <legend className="sr-only">Filter by status</legend>
          {(
            [
              ["all", "All"],
              ["published", "Published"],
              ["draft", "Draft"],
              ["published_with_draft", "Has draft"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={statusFilter === value ? "secondary" : "outline"}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </Button>
          ))}
        </fieldset>
      </div>

      {entryQuery.isLoading && entryQuery.results.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8">
          <p className="text-sm text-muted-foreground">Loading entries...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {entryQuery.results.length === 0
              ? "No entries yet. Create your first one."
              : "No entries match your search or filter."}
          </p>
          {entryQuery.results.length === 0 && (
            <Button asChild size="sm" className="mt-4">
              <Link to="/content/$type/new" params={{ type: contentType.slug }}>
                <Plus className="size-4" />
                Create entry
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {filtered.map((entry) => {
            const status = entry.status;
            return (
              <li key={entry._id}>
                <Link
                  to="/content/$type/$entryId"
                  params={{ type: contentType.slug, entryId: entry._id }}
                  className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {formatContentDate(entry.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {entryQuery.status !== "Exhausted" && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => entryQuery.loadMore(25)}
            disabled={entryQuery.status !== "CanLoadMore"}
          >
            {entryQuery.status === "LoadingMore" ? "Loading more..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
