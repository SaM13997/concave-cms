import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileText } from "lucide-react";
import { getContentTypes } from "@/lib/mock/content";

export const Route = createFileRoute("/_authenticated/content/")({
  component: ContentTypePickerPage,
});

function ContentTypePickerPage() {
  const types = getContentTypes();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a content type to browse and manage entries.
        </p>
      </header>

      {types.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No content types yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((type) => (
            <Link
              key={type.slug}
              to="/content/$type"
              params={{ type: type.slug }}
              className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-muted-foreground/30 hover:bg-card/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <FileText className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-card-foreground">{type.name}</h2>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {type.entryCount} {type.entryCount === 1 ? "entry" : "entries"}
              </p>
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Content types are loaded from mock data. <span data-blocker="BE-003">BE-003</span> blocks
        live CRUD.
      </p>
    </div>
  );
}
