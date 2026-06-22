import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { computeHasUnpublishedChanges } from "./contentPublish";
import type { versionEventTypeValidator } from "./systemValidators";

export type VersionEventType = Infer<typeof versionEventTypeValidator>;

export type ContentEntrySnapshot = {
  title: string;
  data: unknown;
  status: "draft" | "published";
  draftRevision: number;
  publishedRevision?: number;
  publishedTitle?: string;
  publishedData?: unknown;
  hasUnpublishedChanges: boolean;
};

export type ContentHistoryPayload = {
  snapshot: ContentEntrySnapshot;
  beforeSnapshot?: ContentEntrySnapshot;
  revertedToEventId?: string;
  action?: "discard_draft";
};

export type ContentDiffEntry = {
  path: string;
  kind: "added" | "removed" | "changed";
  before?: unknown;
  after?: unknown;
};

export function buildEntrySnapshot(entry: Doc<"contentEntries">): ContentEntrySnapshot {
  return {
    title: entry.title,
    data: entry.data,
    status: entry.status,
    draftRevision: entry.draftRevision,
    publishedRevision: entry.publishedRevision,
    publishedTitle: entry.publishedTitle,
    publishedData: entry.publishedData,
    hasUnpublishedChanges: entry.hasUnpublishedChanges,
  };
}

export function buildHistorySummary(
  eventType: VersionEventType,
  title: string,
  options?: { action?: "discard_draft" },
): string {
  if (options?.action === "discard_draft") {
    return `Discarded draft changes for "${title}"`;
  }

  switch (eventType) {
    case "created":
      return `Created "${title}"`;
    case "updated":
      return `Updated "${title}"`;
    case "published":
      return `Published "${title}"`;
    case "reverted":
      return `Reverted "${title}" to a prior version`;
    case "archived":
      return `Archived "${title}"`;
    default:
      return `Changed "${title}"`;
  }
}

export function extractSnapshotFromPayload(payload: unknown): ContentEntrySnapshot | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("snapshot" in payload) ||
    typeof payload.snapshot !== "object" ||
    payload.snapshot === null
  ) {
    return null;
  }

  const snapshot = payload.snapshot as ContentEntrySnapshot;
  if (typeof snapshot.title !== "string" || typeof snapshot.status !== "string") {
    return null;
  }

  return snapshot;
}

function diffRecordFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  prefix: string,
  diffs: ContentDiffEntry[],
): void {
  const beforeKeys = new Set(Object.keys(before ?? {}));
  const afterKeys = new Set(Object.keys(after ?? {}));

  for (const key of beforeKeys) {
    if (!afterKeys.has(key)) {
      diffs.push({
        path: `${prefix}.${key}`,
        kind: "removed",
        before: before?.[key],
      });
    }
  }

  for (const key of afterKeys) {
    if (!beforeKeys.has(key)) {
      diffs.push({
        path: `${prefix}.${key}`,
        kind: "added",
        after: after?.[key],
      });
    }
  }

  for (const key of beforeKeys) {
    if (!afterKeys.has(key)) {
      continue;
    }
    const beforeValue = before?.[key];
    const afterValue = after?.[key];
    if (JSON.stringify(beforeValue ?? null) !== JSON.stringify(afterValue ?? null)) {
      diffs.push({
        path: `${prefix}.${key}`,
        kind: "changed",
        before: beforeValue,
        after: afterValue,
      });
    }
  }
}

export function diffContentSnapshots(
  before: ContentEntrySnapshot,
  after: ContentEntrySnapshot,
): ContentDiffEntry[] {
  const diffs: ContentDiffEntry[] = [];

  if (before.title !== after.title) {
    diffs.push({ path: "title", kind: "changed", before: before.title, after: after.title });
  }

  if (before.status !== after.status) {
    diffs.push({ path: "status", kind: "changed", before: before.status, after: after.status });
  }

  if (before.draftRevision !== after.draftRevision) {
    diffs.push({
      path: "draftRevision",
      kind: "changed",
      before: before.draftRevision,
      after: after.draftRevision,
    });
  }

  if (before.publishedRevision !== after.publishedRevision) {
    diffs.push({
      path: "publishedRevision",
      kind: "changed",
      before: before.publishedRevision,
      after: after.publishedRevision,
    });
  }

  if (before.hasUnpublishedChanges !== after.hasUnpublishedChanges) {
    diffs.push({
      path: "hasUnpublishedChanges",
      kind: "changed",
      before: before.hasUnpublishedChanges,
      after: after.hasUnpublishedChanges,
    });
  }

  if (before.publishedTitle !== after.publishedTitle) {
    diffs.push({
      path: "publishedTitle",
      kind: "changed",
      before: before.publishedTitle,
      after: after.publishedTitle,
    });
  }

  const beforeData =
    before.data && typeof before.data === "object"
      ? (before.data as Record<string, unknown>)
      : null;
  const afterData =
    after.data && typeof after.data === "object" ? (after.data as Record<string, unknown>) : null;

  diffRecordFields(beforeData, afterData, "data", diffs);

  if (
    JSON.stringify(before.publishedData ?? null) !== JSON.stringify(after.publishedData ?? null)
  ) {
    diffs.push({
      path: "publishedData",
      kind: "changed",
      before: before.publishedData,
      after: after.publishedData,
    });
  }

  return diffs;
}

export function buildRevertPatch(
  entry: Doc<"contentEntries">,
  targetSnapshot: ContentEntrySnapshot,
  now: number,
): {
  title: string;
  data: unknown;
  status: "draft" | "published";
  publishedTitle?: string;
  publishedData?: unknown;
  publishedRevision?: number;
  hasUnpublishedChanges: boolean;
  draftRevision: number;
  updatedAt: number;
} {
  const nextRevision = entry.draftRevision + 1;
  const restoredEntry: Pick<
    Doc<"contentEntries">,
    | "status"
    | "title"
    | "data"
    | "publishedTitle"
    | "publishedData"
    | "draftRevision"
    | "publishedRevision"
    | "hasUnpublishedChanges"
  > = {
    status: targetSnapshot.status,
    title: targetSnapshot.title,
    data: targetSnapshot.data,
    publishedTitle: targetSnapshot.publishedTitle,
    publishedData: targetSnapshot.publishedData,
    draftRevision: nextRevision,
    publishedRevision: targetSnapshot.publishedRevision,
    hasUnpublishedChanges: false,
  };

  return {
    title: targetSnapshot.title,
    data: targetSnapshot.data,
    status: targetSnapshot.status,
    publishedTitle: targetSnapshot.publishedTitle,
    publishedData: targetSnapshot.publishedData,
    publishedRevision: targetSnapshot.publishedRevision,
    draftRevision: nextRevision,
    updatedAt: now,
    hasUnpublishedChanges: computeHasUnpublishedChanges(restoredEntry),
  };
}

export async function recordContentHistoryEvent(
  ctx: MutationCtx,
  args: {
    entryId: Id<"contentEntries">;
    eventType: VersionEventType;
    summary: string;
    actorId: Id<"cmsUsers">;
    snapshot: ContentEntrySnapshot;
    timestamp?: number;
    extraPayload?: Partial<ContentHistoryPayload>;
  },
): Promise<Id<"versionEvents">> {
  const timestamp = args.timestamp ?? Date.now();
  const payload: ContentHistoryPayload = {
    snapshot: args.snapshot,
    ...args.extraPayload,
  };

  return await ctx.db.insert("versionEvents", {
    entityType: "entry",
    entityId: args.entryId,
    eventType: args.eventType,
    summary: args.summary,
    actorId: args.actorId,
    timestamp,
    payload,
  });
}
