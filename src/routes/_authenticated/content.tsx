import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { ContentEntryEditor } from "@/components/content/ContentEntryEditor";
import { InsufficientPermissions } from "@/components/insufficient-permissions";
import { UserButton } from "@/components/User-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const canWrite = !roleLoading && hasPermission("content:write");

  const contentTypes = useQuery(api.content.listContentTypes, canQuery ? {} : "skip");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    if (contentTypes && contentTypes.length > 0 && !selectedType) {
      setSelectedType(contentTypes[0]?.slug ?? null);
    }
  }, [contentTypes, selectedType]);

  const entries = useQuery(
    api.content.listContentEntries,
    canQuery && selectedType ? { contentType: selectedType } : "skip",
  );

  const [selectedId, setSelectedId] = useState<Id<"contentEntries"> | null>(null);
  const selectedEntry = useQuery(
    api.content.getContentEntry,
    canQuery && selectedId ? { entryId: selectedId } : "skip",
  );

  const createEntry = useMutation(api.content.createContentEntry);
  const updateEntry = useMutation(api.content.updateContentEntry);

  const [title, setTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (selectedEntry) {
      setEditTitle(selectedEntry.title);
      setEditData((selectedEntry.data as Record<string, unknown>) ?? {});
    }
  }, [selectedEntry]);

  const activeType = contentTypes?.find((t) => t.slug === selectedType);

  const handleCreate = async () => {
    if (!selectedType) return;
    setError(null);
    try {
      const created = await createEntry({
        contentType: selectedType,
        title: title || "Untitled entry",
        data: {},
      });
      setTitle("");
      setSelectedId(created._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
    }
  };

  const handleSave = useCallback(async () => {
    if (!selectedId) return;
    setError(null);
    setSaveStatus("saving");
    try {
      await updateEntry({
        entryId: selectedId,
        title: editTitle,
        data: editData,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("idle");
      setError(err instanceof Error ? err.message : "Failed to save entry");
    }
  }, [selectedId, editTitle, editData, updateEntry]);

  if (roleLoading) {
    return <div data-testid="content-loading">Loading...</div>;
  }

  if (!hasPermission("content:read")) {
    return <InsufficientPermissions requiredPermission="content:read" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Content</h1>
          <p className="mt-1 text-sm text-muted-foreground">Schema-driven content management</p>
        </div>
        <UserButton />
      </header>

      <main data-testid="content-editor" className="mx-auto mt-8 w-full max-w-4xl flex-1 space-y-4">
        <section data-testid="content-type-switcher">
          <Label className="mb-2 block text-sm font-medium">Content type</Label>
          {contentTypes === undefined ? (
            <p className="text-sm text-muted-foreground">Loading types...</p>
          ) : contentTypes.length === 0 ? (
            <p data-testid="content-no-types" className="text-sm text-muted-foreground">
              No active content types. Apply a schema first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {contentTypes.map((type) => (
                <button
                  key={type.slug}
                  type="button"
                  data-testid={`content-type-${type.slug}`}
                  onClick={() => {
                    setSelectedType(type.slug);
                    setSelectedId(null);
                  }}
                  className={cn(
                    "rounded-md border border-border px-3 py-1.5 text-sm transition-colors",
                    selectedType === type.slug && "border-primary bg-muted font-medium",
                  )}
                >
                  {type.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedType && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section>
              <h2 className="mb-2 text-sm font-medium">Entries</h2>
              <ul data-testid="content-entries-list" className="space-y-2">
                {entries === undefined ? (
                  <li
                    data-testid="content-entries-loading"
                    className="text-sm text-muted-foreground"
                  >
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
                  Select an entry to edit
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
                <div className="space-y-4 rounded-md border border-border p-4">
                  <div>
                    <Label htmlFor="content-edit-title">Title</Label>
                    <Input
                      id="content-edit-title"
                      data-testid="content-edit-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      disabled={!canWrite}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span data-testid="content-detail-status">{selectedEntry.status}</span>
                    <span>·</span>
                    <span>{selectedEntry.contentType}</span>
                  </div>

                  {selectedEntry.schemaFields.length > 0 && (
                    <ContentEntryEditor
                      fields={selectedEntry.schemaFields}
                      data={editData}
                      onChange={setEditData}
                    />
                  )}

                  {canWrite && (
                    <Button
                      data-testid="content-save-button"
                      onClick={() => void handleSave()}
                      disabled={saveStatus === "saving"}
                      type="button"
                    >
                      {saveStatus === "saving"
                        ? "Saving..."
                        : saveStatus === "saved"
                          ? "Saved"
                          : "Save"}
                    </Button>
                  )}

                  {selectedEntry.resolvedReferences &&
                    Object.entries(selectedEntry.resolvedReferences).map(([slug, ref]) =>
                      ref ? (
                        <p
                          key={slug}
                          data-testid={`content-resolved-ref-${slug}`}
                          className="text-xs text-muted-foreground"
                        >
                          {slug}: {ref.title}
                        </p>
                      ) : null,
                    )}
                </div>
              )}
            </section>
          </div>
        )}

        {canWrite && selectedType && (
          <div className="flex gap-2">
            <Input
              data-testid="content-title-input"
              placeholder={`New ${activeType?.name ?? "entry"} title`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Button
              data-testid="content-create-button"
              onClick={() => void handleCreate()}
              type="button"
            >
              Create
            </Button>
          </div>
        )}

        {error && (
          <p data-testid="content-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
