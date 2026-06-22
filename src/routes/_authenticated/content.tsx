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

type PublishStatus = "idle" | "publishing" | "fast" | "slow" | "error";

function StatusBadge({
  status,
  hasUnpublishedChanges,
}: {
  status: "draft" | "published";
  hasUnpublishedChanges: boolean;
}) {
  if (status === "draft") {
    return (
      <span
        data-testid="content-badge-draft"
        className="inline-flex rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-medium text-slate-300"
      >
        Draft
      </span>
    );
  }

  if (hasUnpublishedChanges) {
    return (
      <span
        data-testid="content-badge-unpublished-changes"
        className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-200"
      >
        Unpublished changes
      </span>
    );
  }

  return (
    <span
      data-testid="content-badge-published"
      className="inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-200"
    >
      Published
    </span>
  );
}

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

  const previewTokens = useQuery(
    api.preview.listPreviewTokens,
    canQuery && selectedId ? { entryId: selectedId } : "skip",
  );

  const createEntry = useMutation(api.content.createContentEntry);
  const updateEntry = useMutation(api.content.updateContentEntry);
  const publishEntry = useMutation(api.content.publishContentEntry);
  const discardDraftMutation = useMutation(api.content.discardDraft);
  const generatePreviewToken = useMutation(api.preview.generatePreviewToken);
  const revokePreviewToken = useMutation(api.preview.revokePreviewToken);

  const [title, setTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewCopied, setPreviewCopied] = useState(false);

  useEffect(() => {
    if (selectedEntry) {
      setEditTitle(selectedEntry.title);
      setEditData((selectedEntry.data as Record<string, unknown>) ?? {});
    }
  }, [selectedEntry]);

  const resetPublishPreviewState = () => {
    setPreviewUrl(null);
    setPreviewCopied(false);
    setPublishStatus("idle");
    setPublishMessage(null);
  };

  const activeType = contentTypes?.find((t) => t.slug === selectedType);

  const canPublish =
    selectedEntry && (selectedEntry.status === "draft" || selectedEntry.hasUnpublishedChanges);

  const canDiscard = selectedEntry?.status === "published" && selectedEntry.hasUnpublishedChanges;

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
      resetPublishPreviewState();
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

  const handlePublish = async () => {
    if (!selectedId) return;
    setError(null);
    setPublishStatus("publishing");
    setPublishMessage(null);

    const clientStarted = performance.now();
    try {
      const result = await publishEntry({ entryId: selectedId });
      const totalMs = Math.round(performance.now() - clientStarted);
      const durationMs = Math.max(result.publishDurationMs, totalMs);

      if (durationMs < 200) {
        setPublishStatus("fast");
        setPublishMessage(`Published in ${durationMs}ms`);
      } else {
        setPublishStatus("slow");
        setPublishMessage(`Published in ${durationMs}ms (slower than 200ms target)`);
      }

      setTimeout(() => {
        setPublishStatus("idle");
        setPublishMessage(null);
      }, 4000);
    } catch (err) {
      setPublishStatus("error");
      setPublishMessage(err instanceof Error ? err.message : "Publish failed");
      setError(err instanceof Error ? err.message : "Publish failed");
    }
  };

  const handleDiscard = async () => {
    if (!selectedId) return;
    setError(null);
    try {
      await discardDraftMutation({ entryId: selectedId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to discard draft");
    }
  };

  const handleGeneratePreview = async (revokeExisting: boolean) => {
    if (!selectedId) return;
    setError(null);
    try {
      const result = await generatePreviewToken({
        entryId: selectedId,
        revokeExisting,
      });
      const url = `${window.location.origin}${result.previewPath}`;
      setPreviewUrl(url);
      setPreviewCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate preview link");
    }
  };

  const handleCopyPreview = async () => {
    if (!previewUrl) return;
    await navigator.clipboard.writeText(previewUrl);
    setPreviewCopied(true);
    setTimeout(() => setPreviewCopied(false), 2000);
  };

  const handleRevokeToken = async (tokenId: Id<"previewTokens">) => {
    setError(null);
    try {
      await revokePreviewToken({ tokenId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke preview token");
    }
  };

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
                    resetPublishPreviewState();
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
                        onClick={() => {
                          setSelectedId(entry._id);
                          resetPublishPreviewState();
                        }}
                        className={cn(
                          "w-full rounded-md border border-border px-3 py-2 text-left text-sm transition-colors",
                          selectedId === entry._id && "border-primary bg-muted",
                        )}
                      >
                        <span className="font-medium">{entry.title}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {entry.status}
                          {entry.hasUnpublishedChanges ? " · changes" : ""}
                        </span>
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

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge
                      status={selectedEntry.status}
                      hasUnpublishedChanges={selectedEntry.hasUnpublishedChanges}
                    />
                    <span data-testid="content-detail-status">{selectedEntry.status}</span>
                    <span>·</span>
                    <span>{selectedEntry.contentType}</span>
                    {selectedEntry.status === "published" && selectedEntry.publishedAt && (
                      <>
                        <span>·</span>
                        <span data-testid="content-published-at">
                          Published {new Date(selectedEntry.publishedAt).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>

                  {selectedEntry.schemaFields.length > 0 && (
                    <ContentEntryEditor
                      fields={selectedEntry.schemaFields}
                      data={editData}
                      onChange={setEditData}
                    />
                  )}

                  <div className="flex flex-wrap gap-2">
                    {canWrite && (
                      <Button
                        data-testid="content-save-button"
                        onClick={() => void handleSave()}
                        disabled={saveStatus === "saving"}
                        type="button"
                        variant="secondary"
                      >
                        {saveStatus === "saving"
                          ? "Saving..."
                          : saveStatus === "saved"
                            ? "Saved"
                            : "Save"}
                      </Button>
                    )}

                    {canWrite && canPublish && (
                      <Button
                        data-testid="content-publish-button"
                        onClick={() => void handlePublish()}
                        disabled={publishStatus === "publishing"}
                        type="button"
                      >
                        {publishStatus === "publishing" ? "Publishing..." : "Publish"}
                      </Button>
                    )}

                    {canWrite && canDiscard && (
                      <Button
                        data-testid="content-discard-button"
                        onClick={() => void handleDiscard()}
                        type="button"
                        variant="outline"
                      >
                        Discard draft
                      </Button>
                    )}
                  </div>

                  {publishMessage && (
                    <p
                      data-testid="content-publish-message"
                      className={cn(
                        "text-sm",
                        publishStatus === "error" && "text-destructive",
                        publishStatus === "slow" && "text-amber-400",
                        publishStatus === "fast" && "text-emerald-400",
                      )}
                    >
                      {publishMessage}
                    </p>
                  )}

                  {selectedId && selectedEntry.status === "published" && (
                    <div
                      data-testid="content-published-link"
                      className="rounded-md border border-border bg-muted/30 p-3 text-sm"
                    >
                      <p className="font-medium">Published site</p>
                      <a
                        href={`/p/${selectedId}`}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="content-open-published"
                        className="text-primary underline"
                      >
                        Open published view
                      </a>
                    </div>
                  )}

                  {canWrite && selectedId && (
                    <section
                      data-testid="content-preview-section"
                      className="space-y-2 rounded-md border border-dashed border-border p-3"
                    >
                      <p className="text-sm font-medium">Preview</p>
                      <p className="text-xs text-muted-foreground">
                        Generate a shareable link to preview draft content before publishing.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          data-testid="content-preview-generate"
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleGeneratePreview(false)}
                        >
                          Generate preview link
                        </Button>
                        <Button
                          data-testid="content-preview-regenerate"
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleGeneratePreview(true)}
                        >
                          Regenerate (revoke old)
                        </Button>
                      </div>

                      {previewUrl && (
                        <div className="space-y-2">
                          <Input data-testid="content-preview-url" readOnly value={previewUrl} />
                          <div className="flex gap-2">
                            <Button
                              data-testid="content-preview-copy"
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => void handleCopyPreview()}
                            >
                              {previewCopied ? "Copied!" : "Copy link"}
                            </Button>
                            <Button
                              data-testid="content-preview-open"
                              type="button"
                              size="sm"
                              asChild
                            >
                              <a href={previewUrl} target="_blank" rel="noreferrer">
                                Open preview
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}

                      {previewTokens && previewTokens.length > 0 && (
                        <ul data-testid="content-preview-tokens" className="space-y-1 text-xs">
                          {previewTokens.map((token) => (
                            <li key={token._id} className="flex items-center justify-between gap-2">
                              <span data-testid={`content-preview-token-${token._id}`}>
                                {token.isRevoked && "Revoked · "}
                                {token.isExpired && "Expired · "}
                                {token.isStale && "Stale · "}
                                expires {new Date(token.expiresAt).toLocaleString()}
                              </span>
                              {!token.isRevoked && (
                                <Button
                                  data-testid={`content-preview-revoke-${token._id}`}
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => void handleRevokeToken(token._id)}
                                >
                                  Revoke
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
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
