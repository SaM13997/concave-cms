import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { DraftPublishBar } from "@/components/content/DraftPublishBar";
import { FieldRenderer } from "@/components/content/FieldRenderer";
import { HistoryPanel } from "@/components/content/HistoryPanel";
import { PresenceAvatars } from "@/components/content/PresenceAvatars";
import {
  type EntryStatus,
  getContentType,
  getEntry,
  getHistoryForEntry,
  getMockPreviewUrl,
  getPresenceForEntry,
} from "@/lib/mock/content";

export const Route = createFileRoute("/_authenticated/content/$type/$entryId")({
  loader: ({ params }) => {
    const contentType = getContentType(params.type);
    const entry = getEntry(params.type, params.entryId);

    if (!contentType) {
      throw notFound();
    }

    if (!entry) {
      throw notFound();
    }

    return {
      contentType,
      entry,
      history: getHistoryForEntry(params.entryId),
      presence: getPresenceForEntry(params.entryId),
      previewUrl: getMockPreviewUrl(params.type, params.entryId),
    };
  },
  component: EntryEditorPage,
});

function EntryEditorPage() {
  const { contentType, entry, history, presence, previewUrl } = Route.useLoaderData();
  const [values, setValues] = useState<Record<string, string>>({ ...entry.values });
  const [status, setStatus] = useState<EntryStatus>(entry.status);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(
    history[0]?.version ?? null,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    if (status === "published") {
      setStatus("published_with_draft");
    }
  };

  const handlePublish = () => {
    // BLOCKER(BE-004): Publish requires Convex transactional atomicity
    setStatus("published");
    setIsDirty(false);
    showToast("Published (mock) — BE-004 blocks real publish");
  };

  const handleDiscardDraft = () => {
    // BLOCKER(BE-004): Discard draft requires backend
    setValues({ ...entry.values });
    setStatus(entry.status === "draft" ? "draft" : "published");
    setIsDirty(false);
    showToast("Draft discarded (mock)");
  };

  const handleCopyPreview = async () => {
    // BLOCKER(BE-005): Preview token URLs require Phase 5 backend
    try {
      await navigator.clipboard.writeText(previewUrl);
      showToast("Preview URL copied (mock token)");
    } catch {
      showToast("Could not copy preview URL");
    }
  };

  const handleRevert = (version: number) => {
    // BLOCKER(BE-006): Revert requires version history backend
    showToast(`Revert to v${version} (mock) — BE-006`);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <nav className="mb-2 text-xs text-muted-foreground">
            <Link to="/content" className="hover:text-foreground">
              Content
            </Link>
            <span className="mx-1.5">/</span>
            <Link
              to="/content/$type"
              params={{ type: contentType.slug }}
              className="hover:text-foreground"
            >
              {contentType.name}
            </Link>
            <span className="mx-1.5">/</span>
            <span className="truncate text-foreground">{entry.title}</span>
          </nav>
          <h1 className="truncate text-2xl font-semibold tracking-tight">{entry.title}</h1>
        </div>
        <PresenceAvatars users={presence} />
      </header>

      <DraftPublishBar
        status={status}
        previewUrl={previewUrl}
        isDirty={isDirty}
        onPublish={handlePublish}
        onDiscardDraft={handleDiscardDraft}
        onCopyPreview={handleCopyPreview}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="rounded-lg border border-border bg-card p-5">
          <FieldRenderer fields={contentType.fields} values={values} onChange={handleChange} />
          <p className="mt-6 text-xs text-muted-foreground" data-blocker="BE-003">
            BLOCKER(BE-003): Field saves and reference resolution require Convex content APIs.
          </p>
        </section>

        <HistoryPanel
          events={history}
          selectedVersion={selectedVersion}
          onSelectVersion={setSelectedVersion}
          onRevert={handleRevert}
        />
      </div>

      {toast && (
        <output className="fixed bottom-20 left-1/2 z-50 block -translate-x-1/2 rounded-md border border-border bg-card px-4 py-2 text-sm shadow-lg sm:bottom-6">
          {toast}
        </output>
      )}
    </div>
  );
}
