import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, FileText, NotebookTabs, Orbit, TimerReset } from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { type ContentType, getErrorMessage, mapSchemaToContentType } from "@/lib/content/live";
import { api, useQueries, useQuery } from "@/lib/convex/hooks";

export const Route = createFileRoute("/_authenticated/content/")({
  component: ContentTypePickerPage,
});

type TypeStats = {
  entryCountLabel: string;
  draftCountLabel: string;
};

function ContentTypePickerPage() {
  const schemas = useQuery(api.schemas.list, { status: "active" });
  const contentTypes = useMemo(
    () => (schemas ?? []).map(mapSchemaToContentType).sort((a, b) => a.name.localeCompare(b.name)),
    [schemas],
  );

  const entryRequests = useMemo(
    () =>
      Object.fromEntries(
        contentTypes.map((type) => [
          type.slug,
          {
            query: api.entries.listByType,
            args: {
              contentType: type.slug,
              paginationOpts: {
                cursor: null,
                numItems: 1000,
              },
            },
          },
        ]),
      ),
    [contentTypes],
  );
  const entryResults = useQueries(entryRequests);

  const entryLoadError = Object.values(entryResults).find((result) => result instanceof Error);
  const statsByType = useMemo(() => {
    const stats = new Map<string, TypeStats>();

    for (const type of contentTypes) {
      const result = entryResults[type.slug];
      if (!result || result instanceof Error) {
        stats.set(type.slug, { entryCountLabel: "-", draftCountLabel: "-" });
        continue;
      }

      const draftCount = result.page.filter(
        (entry: { status: string }) => entry.status !== "published",
      ).length;
      stats.set(type.slug, {
        entryCountLabel: result.isDone ? String(result.page.length) : `${result.page.length}+`,
        draftCountLabel: result.isDone ? String(draftCount) : `${draftCount}+`,
      });
    }

    return stats;
  }, [contentTypes, entryResults]);

  const totalDraftCount = useMemo(() => {
    let total = 0;
    let approximate = false;

    for (const type of contentTypes) {
      const result = entryResults[type.slug];
      if (!result || result instanceof Error) {
        return "-";
      }
      total += result.page.filter(
        (entry: { status: string }) => entry.status !== "published",
      ).length;
      if (!result.isDone) {
        approximate = true;
      }
    }

    return approximate ? `${total}+` : String(total);
  }, [contentTypes, entryResults]);

  const isLoading = schemas === undefined;

  return (
    <div className="app-grid">
      <section className="app-panel rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
        <PageHeader
          eyebrow="Content engine"
          title="Drafts, published entries, and preview-ready structure."
          description="Schemas and entries now come from Convex. Pick an active content type, create drafts, and move into the live editing flow."
          actions={
            <>
              <Button asChild variant="outline" className="rounded-full bg-white/80">
                <Link to="/schema">Open schema builder</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link to="/schema">
                  Tune schema
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </>
          }
        />

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <MetricCard
            icon={NotebookTabs}
            label="Content types"
            value={isLoading ? "..." : String(contentTypes.length)}
            note="Active schemas available for live editing."
            tone="mint"
          />
          <MetricCard
            icon={TimerReset}
            label="Draft states"
            value={isLoading ? "..." : totalDraftCount}
            note="Entries waiting on preview checks or publish."
            tone="yellow"
          />
          <MetricCard
            icon={Orbit}
            label="Backend"
            value="Convex"
            note="Schema lists and entry counts are sourced live."
            tone="peach"
          />
        </div>
      </section>

      {entryLoadError instanceof Error ? (
        <div className="app-panel rounded-[1.8rem] px-6 py-12 text-center">
          <p className="text-lg font-semibold text-foreground">Content data could not load.</p>
          <p className="mt-2 text-sm text-muted-foreground">{getErrorMessage(entryLoadError)}</p>
        </div>
      ) : isLoading ? (
        <div className="app-panel rounded-[1.8rem] px-6 py-12 text-center">
          <p className="text-lg font-semibold text-foreground">Loading live content types...</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Convex is fetching active schemas and entry counts.
          </p>
        </div>
      ) : contentTypes.length === 0 ? (
        <div className="app-panel rounded-[1.8rem] px-6 py-12 text-center">
          <p className="text-lg font-semibold text-foreground">No active content types yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Apply at least one schema in the schema builder, then come back here to start editing
            content.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/schema">Go to schema builder</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {contentTypes.map((type) => (
              <ContentTypeCard key={type.slug} type={type} stats={statsByType.get(type.slug)} />
            ))}
          </section>

          <aside className="app-grid">
            <section className="app-panel-soft rounded-[1.8rem] px-5 py-5">
              <p className="app-kicker">How it works</p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">
                Draft and publish happen against the live backend.
              </h2>
              <ol className="mt-5 space-y-4">
                {[
                  "Apply a schema so it becomes active for editors.",
                  "Create a draft from the live content type list.",
                  "Edit fields, generate preview links, and review history.",
                  "Publish when the draft is ready for production.",
                ].map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-foreground shadow-sm">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-6 text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="app-panel rounded-[1.8rem] px-5 py-5">
              <p className="app-kicker">Current state</p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">
                The content frontend is talking to Convex now.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Active schemas, entry collections, and draft lifecycle actions now use the real
                backend instead of mock content definitions.
              </p>
              <p className="mt-4 rounded-[1.15rem] bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">
                Media uploads are still a separate slice, so image fields currently accept asset
                keys or URLs.
              </p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function ContentTypeCard({ type, stats }: { type: ContentType; stats?: TypeStats }) {
  return (
    <Link
      to="/content/$type"
      params={{ type: type.slug }}
      className="app-panel group rounded-[1.8rem] px-5 py-5 transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground shadow-sm">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <span className="rounded-full border border-border bg-white px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {type.fields.length} fields
        </span>
      </div>

      <h2 className="mt-5 text-xl font-semibold text-card-foreground">{type.name}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {type.description || "No description yet."}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
          {stats?.entryCountLabel ?? "-"} entries
        </span>
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          {stats?.draftCountLabel ?? "-"} drafts
        </span>
      </div>

      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
        Open entries
        <ChevronRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof NotebookTabs;
  label: string;
  value: string;
  note: string;
  tone: "mint" | "yellow" | "peach";
}) {
  return (
    <div className="app-metric" data-tone={tone}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <Icon className="size-4 text-foreground/70" aria-hidden="true" />
      </div>
      <p className="mt-3 text-[clamp(2rem,3vw,2.7rem)] font-semibold leading-none text-foreground">
        {value}
      </p>
      <p className="mt-3 text-xs leading-5 text-[color:var(--ink-soft)]">{note}</p>
    </div>
  );
}
