import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { extractBodyHtml } from "@/lib/content-display";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/p/$entryId")({
  component: PublishedPage,
});

function PublishedPage() {
  const { entryId } = Route.useParams();
  const view = useQuery(api.publicContent.getPublishedContentEntry, {
    entryId: entryId as Id<"contentEntries">,
  });

  if (view === undefined) {
    return (
      <div
        data-testid="published-loading"
        className="flex min-h-screen items-center justify-center"
      >
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (view === null) {
    return (
      <div
        data-testid="published-not-found"
        className="flex min-h-screen flex-col items-center justify-center gap-2 px-4"
      >
        <h1 className="text-lg font-semibold">Not published</h1>
        <p className="text-sm text-muted-foreground">
          This content is not available on the published site.
        </p>
      </div>
    );
  }

  const bodyHtml = extractBodyHtml(view.data);

  return (
    <article data-testid="published-page" className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <header className="mb-6 space-y-2 border-b border-border pb-4">
        <span
          data-testid="published-badge"
          className="inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-200"
        >
          Published
        </span>
        <h1 data-testid="published-title" className="text-2xl font-bold tracking-tight">
          {view.title}
        </h1>
        <p className="text-xs text-muted-foreground">{view.contentType}</p>
      </header>

      {bodyHtml ? (
        <div
          data-testid="published-body"
          className="prose prose-invert max-w-none"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: published site renders stored rich text
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : (
        <pre data-testid="published-data" className="text-xs text-muted-foreground">
          {JSON.stringify(view.data, null, 2)}
        </pre>
      )}
    </article>
  );
}
