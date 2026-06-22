import { describe, expect, it } from "vitest";
import {
  buildDiscardPatch,
  buildDraftUpdatePatch,
  buildPublishPatch,
  computeHasUnpublishedChanges,
  getDraftSnapshot,
  getPublishedSnapshot,
  planDiscardDraft,
  planPublish,
} from "./contentPublish";

const baseEntry = {
  status: "draft" as const,
  title: "Hello",
  data: { body: { format: "html" as const, html: "<p>Hi</p>" } },
  draftRevision: 1,
  hasUnpublishedChanges: false,
};

describe("contentPublish shadow drafting", () => {
  it("draft-only entry has no unpublished changes flag", () => {
    expect(computeHasUnpublishedChanges(baseEntry)).toBe(false);
  });

  it("published entry without edits has no unpublished changes", () => {
    const published = {
      ...baseEntry,
      status: "published" as const,
      publishedTitle: "Hello",
      publishedData: baseEntry.data,
      publishedRevision: 1,
    };
    expect(computeHasUnpublishedChanges(published)).toBe(false);
    expect(getPublishedSnapshot(published)).toEqual({
      title: "Hello",
      data: baseEntry.data,
    });
  });

  it("published entry with title edit has unpublished changes", () => {
    const published = {
      ...baseEntry,
      status: "published" as const,
      title: "Hello draft",
      publishedTitle: "Hello",
      publishedData: baseEntry.data,
      publishedRevision: 1,
    };
    expect(computeHasUnpublishedChanges(published)).toBe(true);
    expect(getDraftSnapshot(published).title).toBe("Hello draft");
    expect(getPublishedSnapshot(published)?.title).toBe("Hello");
  });

  it("planPublish allows first publish from draft", () => {
    expect(planPublish(baseEntry)).toEqual({ ok: true });
  });

  it("planPublish rejects when already published with no changes", () => {
    const published = {
      ...baseEntry,
      status: "published" as const,
      publishedTitle: "Hello",
      publishedData: baseEntry.data,
      publishedRevision: 1,
    };
    expect(planPublish(published)).toEqual({
      ok: false,
      reason: "No unpublished changes to publish",
    });
  });

  it("buildPublishPatch copies draft into published snapshot atomically", () => {
    const now = 1_700_000_000_000;
    const published = {
      ...baseEntry,
      status: "published" as const,
      title: "Updated title",
      data: { body: { format: "html" as const, html: "<p>New</p>" } },
      publishedTitle: "Hello",
      publishedData: baseEntry.data,
      draftRevision: 3,
      hasUnpublishedChanges: true,
      publishedRevision: 1,
    };

    const patch = buildPublishPatch(published, now);
    expect(patch).toEqual({
      status: "published",
      publishedTitle: "Updated title",
      publishedData: published.data,
      publishedAt: now,
      publishedRevision: 3,
      hasUnpublishedChanges: false,
    });
  });

  it("planDiscardDraft requires published entry with changes", () => {
    expect(planDiscardDraft(baseEntry)).toEqual({
      ok: false,
      reason: "Entry has not been published yet",
    });

    const published = {
      ...baseEntry,
      status: "published" as const,
      title: "Draft title",
      publishedTitle: "Hello",
      publishedData: baseEntry.data,
      publishedRevision: 1,
    };
    expect(planDiscardDraft(published)).toEqual({ ok: true });
    expect(buildDiscardPatch(published)).toEqual({
      title: "Hello",
      data: baseEntry.data,
      hasUnpublishedChanges: false,
    });
  });

  it("buildDraftUpdatePatch increments revision and flags unpublished changes", () => {
    const published = {
      ...baseEntry,
      status: "published" as const,
      publishedTitle: "Hello",
      publishedData: baseEntry.data,
      publishedRevision: 1,
    };

    const patch = buildDraftUpdatePatch(
      published,
      "New title",
      { body: { format: "html", html: "<p>x</p>" } },
      123,
    );

    expect(patch.draftRevision).toBe(2);
    expect(patch.hasUnpublishedChanges).toBe(true);
    expect(patch.title).toBe("New title");
  });
});

describe("integration: publish atomicity invariants", () => {
  it("published snapshot never includes in-progress draft after discard", () => {
    const published = {
      ...baseEntry,
      status: "published" as const,
      title: "Draft edit",
      data: { body: { format: "html" as const, html: "<p>Draft</p>" } },
      publishedTitle: "Hello",
      publishedData: baseEntry.data,
      draftRevision: 2,
      hasUnpublishedChanges: true,
      publishedRevision: 1,
    };

    const discarded = buildDiscardPatch(published);
    const afterDiscard = { ...published, ...discarded };
    expect(computeHasUnpublishedChanges(afterDiscard)).toBe(false);
    expect(getPublishedSnapshot(afterDiscard)?.title).toBe("Hello");
    expect(getDraftSnapshot(afterDiscard).title).toBe("Hello");
  });

  it("publish then read published view matches published fields only", () => {
    const now = Date.now();
    const draft = {
      ...baseEntry,
      title: "Live title",
      data: { body: { format: "html" as const, html: "<p>Live</p>" } },
      draftRevision: 2,
    };

    const published = { ...draft, ...buildPublishPatch(draft, now) };
    const snapshot = getPublishedSnapshot(published);
    expect(snapshot?.title).toBe("Live title");
    expect(snapshot?.data).toEqual(draft.data);
  });
});
