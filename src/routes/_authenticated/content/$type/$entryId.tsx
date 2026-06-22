import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useCmsUser } from "@/components/CmsUserProvider";
import { DraftPublishBar } from "@/components/content/DraftPublishBar";
import { FieldRenderer } from "@/components/content/FieldRenderer";
import { HistoryPanel } from "@/components/content/HistoryPanel";
import { PresenceAvatars } from "@/components/content/PresenceAvatars";
import { Button } from "@/components/ui/button";
import {
  buildDraftValues,
  buildPreviewUrl,
  deriveEntryStatus,
  describeChangedFields,
  formatContentDate,
  getEntryTitle,
  getErrorMessage,
  getHistoryActorLabel,
  mapIssuesToFieldErrors,
  mapSchemaToContentType,
  prepareDraftData,
} from "@/lib/content/live";
import { api, useMutation, useQueries, useQuery } from "@/lib/convex/hooks";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_authenticated/content/$type/$entryId")({
  component: EntryEditorPage,
});

function EntryEditorPage() {
  const { type, entryId } = Route.useParams();
  const liveEntryId = entryId as Id<"entries">;
  const schema = useQuery(api.schemas.getBySlug, { slug: type });
  const entry = useQuery(api.entries.getById, { entryId: liveEntryId });
  const me = useCmsUser();
  const history = useQuery(api.entries.listHistory, entry ? { entryId: liveEntryId } : "skip");
  const presence = useQuery(
    api.presence.listForResource,
    entry ? { resourceType: "entry", resourceId: entryId } : "skip",
  );

  const contentType = useMemo(() => (schema ? mapSchemaToContentType(schema) : null), [schema]);
  const liveStatus = entry ? deriveEntryStatus(entry) : "draft";

  const updateDraft = useMutation(api.entries.updateDraft);
  const publishEntry = useMutation(api.publish.publish);
  const discardDraft = useMutation(api.publish.discardDraft);
  const createPreviewToken = useMutation(api.preview.createToken);
  const revertToVersion = useMutation(api.history.revertToVersion);
  const heartbeat = useMutation(api.presence.heartbeat);
  const disconnectPresence = useMutation(api.presence.disconnect);

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewExpiresAt, setPreviewExpiresAt] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const syncedEntryRef = useRef<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const referenceRequests = useMemo(() => {
    if (!contentType) {
      return {};
    }

    return Object.fromEntries(
      Array.from(
        new Set(
          contentType.fields
            .map((field) => field.referenceType)
            .filter((referenceType): referenceType is string => Boolean(referenceType)),
        ),
      ).map((referenceType) => [
        referenceType,
        {
          query: api.entries.listByType,
          args: {
            contentType: referenceType,
            paginationOpts: {
              cursor: null,
              numItems: 100,
            },
          },
        },
      ]),
    );
  }, [contentType]);
  const referenceResults = useQueries(referenceRequests);

  const referenceOptions = useMemo(() => {
    if (!contentType) {
      return {};
    }

    return Object.fromEntries(
      contentType.fields
        .filter((field) => field.type === "reference" && field.referenceType)
        .map((field) => {
          if (!field.referenceType) {
            return [field.name, []];
          }

          const result = referenceResults[field.referenceType];
          return [
            field.name,
            result && !(result instanceof Error)
              ? result.page.map((relatedEntry: { _id: string; title: string }) => ({
                  id: relatedEntry._id,
                  label: relatedEntry.title,
                }))
              : [],
          ];
        }),
    );
  }, [contentType, referenceResults]);

  useEffect(() => {
    if (!entry || !contentType) {
      return;
    }

    const signature = `${entry._id}:${entry.version}`;
    const isSameEntry = syncedEntryRef.current?.startsWith(`${entry._id}:`) ?? false;

    if (!isDirty || !isSameEntry || syncedEntryRef.current === null) {
      setValues(buildDraftValues(contentType.fields, entry.draftData as Record<string, unknown>));
      setFieldErrors({});
      setFormError(null);
      setIsDirty(false);
      syncedEntryRef.current = signature;
    }
  }, [contentType, entry, isDirty]);

  useEffect(() => {
    if (selectedVersion !== null) {
      return;
    }
    if (history && history.length > 0) {
      setSelectedVersion(history[0].version);
      return;
    }
    if (entry) {
      setSelectedVersion(entry.version);
    }
  }, [entry, history, selectedVersion]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const sendHeartbeat = useEffectEvent(async () => {
    if (!entry) {
      return;
    }

    try {
      await heartbeat({ resourceType: "entry", resourceId: entryId });
    } catch {
      // Presence is a progressive enhancement.
    }
  });

  useEffect(() => {
    if (!entry) {
      return;
    }

    void sendHeartbeat();
    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, 20_000);

    return () => {
      window.clearInterval(intervalId);
      void disconnectPresence({ resourceType: "entry", resourceId: entryId }).catch(
        () => undefined,
      );
    };
  }, [disconnectPresence, entry, entryId]);

  const comparison = useQuery(
    api.history.compareVersions,
    entry && selectedVersion !== null
      ? {
          entryId: liveEntryId,
          fromVersion: selectedVersion,
          toVersion: entry.version,
        }
      : "skip",
  );

  const historyEvents = useMemo(
    () =>
      (history ?? [])
        .filter(
          (
            event,
          ): event is typeof event & {
            action: "created" | "updated" | "published" | "reverted";
          } => event.action !== "schema_applied",
        )
        .map((event) => ({
          id: event._id,
          timestamp: event.changedAt,
          action: event.action,
          userName: getHistoryActorLabel(event.changedBy, me?._id),
          summary: event.summary,
          version: event.version,
        })),
    [history, me?._id],
  );

  const changedFields = useMemo(
    () =>
      contentType && comparison
        ? describeChangedFields(contentType.fields, comparison.changedFields)
        : [],
    [comparison, contentType],
  );

  const presenceUsers = useMemo(
    () =>
      (presence ?? [])
        .filter((session) => session.userId !== me?._id)
        .map((session) => ({
          id: session._id,
          name: session.displayName,
          initials: session.initials,
          color: session.color,
        })),
    [me?._id, presence],
  );

  const displayTitle = useMemo(() => getEntryTitle(values as Record<string, unknown>), [values]);

  const currentStatus = isDirty && liveStatus === "published" ? "published_with_draft" : liveStatus;

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2500);
  };

  const handleChange = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFormError(null);
    setIsDirty(true);
  };

  const saveDraft = async (options?: { silent?: boolean }) => {
    if (!entry || !contentType) {
      return null;
    }

    if (!isDirty) {
      return entry;
    }

    const prepared = prepareDraftData(contentType.fields, values);
    if (!prepared.success) {
      setFieldErrors(prepared.errors);
      setFormError("Fix the highlighted fields before saving.");
      return null;
    }

    setIsSaving(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const result = await updateDraft({
        entryId: entry._id,
        data: prepared.data,
        expectedVersion: entry.version,
      });

      if (!result.success) {
        setFieldErrors(mapIssuesToFieldErrors(result.issues));
        setFormError("Fix the highlighted fields before saving.");
        return null;
      }

      setValues(
        buildDraftValues(contentType.fields, result.entry.draftData as Record<string, unknown>),
      );
      setIsDirty(false);
      syncedEntryRef.current = `${result.entry._id}:${result.entry.version}`;
      if (!options?.silent) {
        showToast("Draft saved.");
      }
      return result.entry;
    } catch (error) {
      setFormError(getErrorMessage(error, "Could not save the draft."));
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!entry) {
      return;
    }

    setIsPublishing(true);
    try {
      const entryToPublish = await saveDraft({ silent: true });
      if (!entryToPublish) {
        return;
      }

      const result = await publishEntry({
        entryId: entryToPublish._id,
        expectedVersion: entryToPublish.version,
      });

      syncedEntryRef.current = `${result.entry._id}:${result.entry.version}`;
      setValues(
        buildDraftValues(
          contentType?.fields ?? [],
          result.entry.draftData as Record<string, unknown>,
        ),
      );
      setIsDirty(false);
      setFieldErrors({});
      setFormError(null);
      showToast(`Published in ${result.durationMs}ms.`);
    } catch (error) {
      setFormError(getErrorMessage(error, "Could not publish the entry."));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!entry || !contentType) {
      return;
    }

    if (liveStatus !== "published_with_draft") {
      setValues(buildDraftValues(contentType.fields, entry.draftData as Record<string, unknown>));
      setFieldErrors({});
      setFormError(null);
      setIsDirty(false);
      showToast("Unsaved changes reset.");
      return;
    }

    setIsDiscarding(true);
    try {
      const updated = await discardDraft({
        entryId: entry._id,
        expectedVersion: entry.version,
      });
      syncedEntryRef.current = `${updated._id}:${updated.version}`;
      setValues(buildDraftValues(contentType.fields, updated.draftData as Record<string, unknown>));
      setFieldErrors({});
      setFormError(null);
      setIsDirty(false);
      showToast("Draft discarded.");
    } catch (error) {
      setFormError(getErrorMessage(error, "Could not discard the draft."));
    } finally {
      setIsDiscarding(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!entry) {
      return;
    }

    setIsGeneratingPreview(true);
    try {
      const savedEntry = await saveDraft({ silent: true });
      if (!savedEntry) {
        return;
      }

      const token = await createPreviewToken({ entryId: savedEntry._id });
      setPreviewUrl(buildPreviewUrl(token.previewPath));
      setPreviewExpiresAt(formatContentDate(token.expiresAt));
      showToast("Preview link ready.");
    } catch (error) {
      setFormError(getErrorMessage(error, "Could not generate a preview link."));
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleCopyPreview = async () => {
    if (!previewUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(previewUrl);
      showToast("Preview URL copied.");
    } catch {
      showToast("Could not copy preview URL.");
    }
  };

  const handleRevert = async (version: number) => {
    if (!entry || !contentType) {
      return;
    }

    setIsReverting(true);
    try {
      const reverted = await revertToVersion({
        entryId: entry._id,
        targetVersion: version,
        expectedVersion: entry.version,
      });
      syncedEntryRef.current = `${reverted._id}:${reverted.version}`;
      setValues(
        buildDraftValues(contentType.fields, reverted.draftData as Record<string, unknown>),
      );
      setFieldErrors({});
      setFormError(null);
      setIsDirty(false);
      setSelectedVersion(reverted.version);
      showToast(`Reverted to v${version}.`);
    } catch (error) {
      setFormError(getErrorMessage(error, "Could not revert this entry."));
    } finally {
      setIsReverting(false);
    }
  };

  if (schema === undefined || entry === undefined) {
    return (
      <div className="rounded-lg border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">Loading entry...</p>
      </div>
    );
  }

  if (!schema || !contentType || !entry || entry.contentType !== type) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-base font-semibold text-foreground">Entry not found.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This route does not match a live entry in Convex.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link to="/content/$type" params={{ type }}>
            Back to entries
          </Link>
        </Button>
      </div>
    );
  }

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
            <span className="truncate text-foreground">{displayTitle}</span>
          </nav>
          <h1 className="truncate text-2xl font-semibold tracking-tight">{displayTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Updated {formatContentDate(entry.updatedAt)}
            {entry.publishedAt ? ` / Last published ${formatContentDate(entry.publishedAt)}` : ""}
          </p>
        </div>
        <PresenceAvatars users={presenceUsers} />
      </header>

      <DraftPublishBar
        status={currentStatus}
        previewUrl={previewUrl}
        previewExpiresAt={previewExpiresAt}
        isDirty={isDirty}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isDiscarding={isDiscarding}
        isGeneratingPreview={isGeneratingPreview}
        onSaveDraft={() => {
          void saveDraft();
        }}
        onPublish={() => {
          void handlePublish();
        }}
        onDiscardDraft={() => {
          void handleDiscardDraft();
        }}
        onGeneratePreview={() => {
          void handleGeneratePreview();
        }}
        onCopyPreview={() => {
          void handleCopyPreview();
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="rounded-lg border border-border bg-card p-5">
          <FieldRenderer
            fields={contentType.fields}
            values={values}
            errors={fieldErrors}
            referenceOptions={referenceOptions}
            onChange={handleChange}
          />
          {formError && <p className="mt-6 text-sm text-destructive">{formError}</p>}
          {schema.status !== "active" && (
            <p className="mt-6 text-xs text-muted-foreground">
              This schema is not active, so save and publish actions may fail until it is applied.
            </p>
          )}
        </section>

        <HistoryPanel
          events={historyEvents}
          selectedVersion={selectedVersion}
          changedFields={changedFields}
          isComparing={entry !== undefined && selectedVersion !== null && comparison === undefined}
          isReverting={isReverting}
          onSelectVersion={setSelectedVersion}
          onRevert={(version) => {
            void handleRevert(version);
          }}
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
