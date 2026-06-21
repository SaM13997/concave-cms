import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { InsufficientPermissions } from "@/components/insufficient-permissions";
import { UserButton } from "@/components/User-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyRole } from "@/hooks/use-my-role";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_authenticated/content")({
  component: ContentPage,
});

function ContentPage() {
  const { hasPermission, isLoading: roleLoading } = useMyRole();
  const canQuery = !roleLoading && hasPermission("content:read");
  const entries = useQuery(api.content.listContentEntries, canQuery ? {} : "skip");
  const [selectedId, setSelectedId] = useState<Id<"contentEntries"> | null>(null);
  const selectedEntry = useQuery(
    api.content.getContentEntry,
    canQuery && selectedId ? { entryId: selectedId } : "skip",
  );
  const createEntry = useMutation(api.content.createContentEntry);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (roleLoading) {
    return <div data-testid="content-loading">Loading...</div>;
  }

  if (!hasPermission("content:read")) {
    return <InsufficientPermissions requiredPermission="content:read" />;
  }

  const handleCreate = async () => {
    setError(null);
    try {
      const created = await createEntry({ title: title || "Untitled entry" });
      setTitle("");
      setSelectedId(created._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Content</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage content entries</p>
        </div>
        <UserButton />
      </header>

      <main data-testid="content-editor" className="mx-auto mt-8 w-full max-w-3xl flex-1 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <section>
            <h2 className="mb-2 text-sm font-medium">Entries</h2>
            <ul data-testid="content-entries-list" className="space-y-2">
              {entries === undefined ? (
                <li data-testid="content-entries-loading" className="text-sm text-muted-foreground">
                  Loading entries...
                </li>
              ) : entries.length === 0 ? (
                <li data-testid="content-entries-empty" className="text-sm text-muted-foreground">
                  No entries yet
                </li>
              ) : (
                entries.map((entry) => (
                  <li key={entry._id}>
                    <button
                      type="button"
                      data-testid={`content-entry-${entry._id}`}
                      onClick={() => setSelectedId(entry._id)}
                      className={cn(
                        "w-full rounded-md border border-border px-3 py-2 text-left text-sm transition-colors",
                        selectedId === entry._id && "border-primary bg-muted",
                      )}
                    >
                      <span className="font-medium">{entry.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{entry.status}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section data-testid="content-entry-detail">
            <h2 className="mb-2 text-sm font-medium">Detail</h2>
            {!selectedId ? (
              <p data-testid="content-detail-empty" className="text-sm text-muted-foreground">
                Select an entry to view details
              </p>
            ) : selectedEntry === undefined ? (
              <p data-testid="content-detail-loading" className="text-sm text-muted-foreground">
                Loading entry...
              </p>
            ) : selectedEntry === null ? (
              <p data-testid="content-detail-not-found" className="text-sm text-destructive">
                Entry not found
              </p>
            ) : (
              <dl className="space-y-2 rounded-md border border-border p-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Title</dt>
                  <dd data-testid="content-detail-title">{selectedEntry.title}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd data-testid="content-detail-status">{selectedEntry.status}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd>{selectedEntry.contentType}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd>{new Date(selectedEntry.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>
            )}
          </section>
        </div>

        <div className="flex gap-2">
          <Input
            data-testid="content-title-input"
            placeholder="Entry title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Button data-testid="content-create-button" onClick={handleCreate} type="button">
            Create
          </Button>
        </div>
        {error && (
          <p data-testid="content-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
