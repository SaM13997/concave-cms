import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { extractBodyHtml } from "@/lib/content-display";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/preview/$token")({
  component: PreviewPage,
});

function PreviewPage() {
  const { token } = Route.useParams();
  const result = useQuery(api.publicContent.getPreviewContentByToken, { token });

  if (result === undefined) {
    return (
      <div data-testid="preview-loading" className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading preview...</p>
      </div>
    );
  }

  if (result === null) {
    return (
      <div
        data-testid="preview-invalid"
        className="flex min-h-screen flex-col items-center justify-center gap-2 px-4"
      >
        <h1 className="text-lg font-semibold">Preview unavailable</h1>
        <p className="text-sm text-muted-foreground">
          This preview link is invalid, expired, revoked, or out of date.
        </p>
      </div>
    );
  }

  const { view, warning } = result;
  const bodyHtml = extractBodyHtml(view.data);

  return (
    <article data-testid="preview-page" className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <header className="mb-6 space-y-2 border-b border-border pb-4">
        <span
          data-testid="preview-badge"
          className="inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-200"
        >
          Draft preview
        </span>
        {warning && (
          <p data-testid="preview-warning" className="text-sm text-amber-400">
            {warning}
          </p>
        )}
        <h1 data-testid="preview-title" className="text-2xl font-bold tracking-tight">
          {view.title}
        </h1>
        <p className="text-xs text-muted-foreground">{view.contentType}</p>
      </header>

      {bodyHtml ? (
        <div
          data-testid="preview-body"
          className="prose prose-invert max-w-none"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: preview renders stored rich text
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : (
        <pre data-testid="preview-data" className="text-xs text-muted-foreground">
          {JSON.stringify(view.data, null, 2)}
        </pre>
      )}
    </article>
  );
}
