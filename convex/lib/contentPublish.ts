import type { Doc } from "../_generated/dataModel";

export type ContentEntryDoc = Pick<
  Doc<"contentEntries">,
  | "status"
  | "title"
  | "data"
  | "publishedTitle"
  | "publishedData"
  | "hasUnpublishedChanges"
  | "draftRevision"
  | "publishedRevision"
>;

export type PublishedSnapshot = {
  title: string;
  data: unknown;
};

export function deepEqualJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function entryHasBeenPublished(entry: Pick<ContentEntryDoc, "status">): boolean {
  return entry.status === "published";
}

export function computeHasUnpublishedChanges(entry: ContentEntryDoc): boolean {
  if (entry.status === "draft") {
    return false;
  }

  const publishedTitle = entry.publishedTitle ?? entry.title;
  const publishedData = entry.publishedData ?? entry.data;

  return entry.title !== publishedTitle || !deepEqualJson(entry.data, publishedData);
}

export function getPublishedSnapshot(entry: ContentEntryDoc): PublishedSnapshot | null {
  if (!entryHasBeenPublished(entry)) {
    return null;
  }

  return {
    title: entry.publishedTitle ?? entry.title,
    data: entry.publishedData ?? entry.data,
  };
}

export function getDraftSnapshot(entry: ContentEntryDoc): PublishedSnapshot {
  return {
    title: entry.title,
    data: entry.data,
  };
}

export type PublishPlanResult = { ok: true } | { ok: false; reason: string };

export function planPublish(entry: ContentEntryDoc): PublishPlanResult {
  if (!entry.title.trim()) {
    return { ok: false, reason: "Title is required to publish" };
  }

  if (entry.status === "published" && !computeHasUnpublishedChanges(entry)) {
    return { ok: false, reason: "No unpublished changes to publish" };
  }

  return { ok: true };
}

export type DiscardPlanResult = { ok: true } | { ok: false; reason: string };

export function planDiscardDraft(entry: ContentEntryDoc): DiscardPlanResult {
  if (!entryHasBeenPublished(entry)) {
    return { ok: false, reason: "Entry has not been published yet" };
  }

  if (!computeHasUnpublishedChanges(entry)) {
    return { ok: false, reason: "No draft changes to discard" };
  }

  return { ok: true };
}

export function buildPublishPatch(
  entry: ContentEntryDoc,
  now: number,
): {
  status: "published";
  publishedTitle: string;
  publishedData: unknown;
  publishedAt: number;
  publishedRevision: number;
  hasUnpublishedChanges: false;
} {
  return {
    status: "published",
    publishedTitle: entry.title,
    publishedData: entry.data,
    publishedAt: now,
    publishedRevision: entry.draftRevision,
    hasUnpublishedChanges: false,
  };
}

export function buildDiscardPatch(entry: ContentEntryDoc): {
  title: string;
  data: unknown;
  hasUnpublishedChanges: false;
} {
  const snapshot = getPublishedSnapshot(entry);
  if (!snapshot) {
    throw new Error("Cannot discard draft on unpublished entry");
  }

  return {
    title: snapshot.title,
    data: snapshot.data,
    hasUnpublishedChanges: false,
  };
}

export function buildDraftUpdatePatch(
  entry: ContentEntryDoc,
  title: string,
  data: unknown,
  now: number,
): {
  title: string;
  data: unknown;
  updatedAt: number;
  draftRevision: number;
  hasUnpublishedChanges: boolean;
} {
  const nextRevision = entry.draftRevision + 1;
  const nextEntry: ContentEntryDoc = {
    ...entry,
    title,
    data,
    draftRevision: nextRevision,
  };

  return {
    title,
    data,
    updatedAt: now,
    draftRevision: nextRevision,
    hasUnpublishedChanges: entryHasBeenPublished(nextEntry)
      ? computeHasUnpublishedChanges(nextEntry)
      : false,
  };
}
