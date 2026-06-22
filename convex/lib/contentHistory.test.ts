import { describe, expect, it } from "vitest";
import {
  buildEntrySnapshot,
  buildHistorySummary,
  buildRevertPatch,
  type ContentEntrySnapshot,
  diffContentSnapshots,
  extractSnapshotFromPayload,
} from "./contentHistory";

const baseSnapshot: ContentEntrySnapshot = {
  title: "Hello",
  data: { body: { format: "html", html: "<p>Hi</p>" } },
  status: "draft",
  draftRevision: 1,
  hasUnpublishedChanges: false,
};

describe("contentHistory snapshots", () => {
  it("buildHistorySummary covers create/update/publish/discard/revert", () => {
    expect(buildHistorySummary("created", "Post")).toBe('Created "Post"');
    expect(buildHistorySummary("updated", "Post")).toBe('Updated "Post"');
    expect(buildHistorySummary("published", "Post")).toBe('Published "Post"');
    expect(buildHistorySummary("reverted", "Post")).toBe('Reverted "Post" to a prior version');
    expect(buildHistorySummary("updated", "Post", { action: "discard_draft" })).toBe(
      'Discarded draft changes for "Post"',
    );
  });

  it("extractSnapshotFromPayload reads nested snapshot", () => {
    const payload = { snapshot: baseSnapshot };
    expect(extractSnapshotFromPayload(payload)).toEqual(baseSnapshot);
    expect(extractSnapshotFromPayload({ title: "legacy" })).toBeNull();
  });

  it("buildEntrySnapshot copies entry fields", () => {
    const snapshot = buildEntrySnapshot({
      title: "Hello",
      data: baseSnapshot.data,
      status: "published",
      draftRevision: 2,
      publishedRevision: 1,
      publishedTitle: "Hello",
      publishedData: baseSnapshot.data,
      hasUnpublishedChanges: false,
    } as Parameters<typeof buildEntrySnapshot>[0]);

    expect(snapshot.status).toBe("published");
    expect(snapshot.publishedRevision).toBe(1);
  });
});

describe("contentHistory diff", () => {
  it("diffContentSnapshots detects title and data changes", () => {
    const after: ContentEntrySnapshot = {
      ...baseSnapshot,
      title: "Updated",
      data: { body: { format: "html", html: "<p>New</p>" } },
      draftRevision: 2,
    };

    const diffs = diffContentSnapshots(baseSnapshot, after);
    expect(diffs.some((d) => d.path === "title" && d.kind === "changed")).toBe(true);
    expect(diffs.some((d) => d.path === "data.body" && d.kind === "changed")).toBe(true);
    expect(diffs.some((d) => d.path === "draftRevision" && d.kind === "changed")).toBe(true);
  });

  it("diffContentSnapshots returns empty for identical snapshots", () => {
    expect(diffContentSnapshots(baseSnapshot, baseSnapshot)).toEqual([]);
  });
});

describe("contentHistory revert patch", () => {
  it("buildRevertPatch restores target snapshot and bumps draft revision", () => {
    const target: ContentEntrySnapshot = {
      title: "Published title",
      data: { body: { format: "html", html: "<p>Old</p>" } },
      status: "published",
      draftRevision: 3,
      publishedRevision: 3,
      publishedTitle: "Published title",
      publishedData: { body: { format: "html", html: "<p>Old</p>" } },
      hasUnpublishedChanges: false,
    };

    const patch = buildRevertPatch(
      {
        title: "Draft title",
        data: { body: { format: "html", html: "<p>New draft</p>" } },
        status: "published",
        draftRevision: 5,
        publishedRevision: 3,
        publishedTitle: "Published title",
        publishedData: target.publishedData,
        hasUnpublishedChanges: true,
      } as Parameters<typeof buildRevertPatch>[0],
      target,
      1_700_000_000_000,
    );

    expect(patch.title).toBe("Published title");
    expect(patch.draftRevision).toBe(6);
    expect(patch.hasUnpublishedChanges).toBe(false);
  });
});

describe("integration: history event expectations", () => {
  it("create then update produces distinct snapshots with revision increment", () => {
    const created = baseSnapshot;
    const updated: ContentEntrySnapshot = {
      ...created,
      title: "Hello v2",
      draftRevision: 2,
      data: { body: { format: "html", html: "<p>Updated</p>" } },
    };

    const createPayload = { snapshot: created };
    const updatePayload = { snapshot: updated };

    expect(extractSnapshotFromPayload(createPayload)?.draftRevision).toBe(1);
    expect(extractSnapshotFromPayload(updatePayload)?.draftRevision).toBe(2);
    expect(diffContentSnapshots(created, updated).length).toBeGreaterThan(0);
  });

  it("publish snapshot includes published fields", () => {
    const published: ContentEntrySnapshot = {
      ...baseSnapshot,
      status: "published",
      publishedTitle: "Hello",
      publishedData: baseSnapshot.data,
      publishedRevision: 1,
      hasUnpublishedChanges: false,
    };

    const payload = { snapshot: published };
    const snapshot = extractSnapshotFromPayload(payload);
    expect(snapshot?.status).toBe("published");
    expect(snapshot?.publishedRevision).toBe(1);
  });

  it("discard snapshot restores published draft alignment", () => {
    const before: ContentEntrySnapshot = {
      title: "Draft edit",
      data: { body: { format: "html", html: "<p>Draft</p>" } },
      status: "published",
      draftRevision: 4,
      publishedRevision: 2,
      publishedTitle: "Hello",
      publishedData: { body: { format: "html", html: "<p>Hi</p>" } },
      hasUnpublishedChanges: true,
    };

    const after: ContentEntrySnapshot = {
      ...before,
      title: "Hello",
      data: before.publishedData,
      hasUnpublishedChanges: false,
    };

    const payload = { snapshot: after, action: "discard_draft" as const };
    expect(extractSnapshotFromPayload(payload)?.title).toBe("Hello");
    expect(diffContentSnapshots(before, after).some((d) => d.path === "title")).toBe(true);
  });
});
