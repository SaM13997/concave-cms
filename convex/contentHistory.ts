import { v } from "convex/values";
import { writeAuditLog } from "./lib/audit";
import {
  buildEntrySnapshot,
  buildHistorySummary,
  buildRevertPatch,
  diffContentSnapshots,
  extractSnapshotFromPayload,
  recordContentHistoryEvent,
} from "./lib/contentHistory";
import { type AuthedRoleCtx, editorMutation, editorQuery } from "./lib/rbac";
import {
  contentCompareResultValidator,
  contentEntryListItemValidator,
  contentHistoryItemValidator,
} from "./lib/systemValidators";

function toListItem(entry: {
  _id: import("./_generated/dataModel").Id<"contentEntries">;
  _creationTime: number;
  contentType: string;
  title: string;
  status: "draft" | "published";
  hasUnpublishedChanges: boolean;
  updatedAt: number;
}) {
  return {
    _id: entry._id,
    _creationTime: entry._creationTime,
    contentType: entry.contentType,
    title: entry.title,
    status: entry.status,
    hasUnpublishedChanges: entry.hasUnpublishedChanges,
    updatedAt: entry.updatedAt,
  };
}

export const listEntryHistory = editorQuery({
  args: {
    entryId: v.id("contentEntries"),
    limit: v.optional(v.number()),
  },
  returns: v.array(contentHistoryItemValidator),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Content entry not found");
    }

    const limit = args.limit ?? 50;
    const events = await ctx.db
      .query("versionEvents")
      .withIndex("by_entity", (q) => q.eq("entityType", "entry").eq("entityId", args.entryId))
      .order("desc")
      .take(limit);

    const actorIds = [...new Set(events.map((event) => event.actorId))];
    const actors = new Map<import("./_generated/dataModel").Id<"cmsUsers">, { name: string }>();
    for (const actorId of actorIds) {
      const actor = await ctx.db.get(actorId);
      actors.set(actorId, { name: actor?.name ?? "Unknown" });
    }

    const items = [];
    for (const event of events) {
      const snapshot = extractSnapshotFromPayload(event.payload);
      if (!snapshot) {
        continue;
      }

      items.push({
        _id: event._id,
        eventType: event.eventType,
        summary: event.summary,
        actorId: event.actorId,
        actorName: actors.get(event.actorId)?.name ?? "Unknown",
        timestamp: event.timestamp,
        snapshot,
      });
    }

    return items;
  },
});

export const compareVersions = editorQuery({
  args: {
    leftEventId: v.id("versionEvents"),
    rightEventId: v.id("versionEvents"),
  },
  returns: contentCompareResultValidator,
  handler: async (ctx, args) => {
    const [leftEvent, rightEvent] = await Promise.all([
      ctx.db.get(args.leftEventId),
      ctx.db.get(args.rightEventId),
    ]);

    if (!leftEvent || !rightEvent) {
      throw new Error("Version event not found");
    }

    if (leftEvent.entityType !== "entry" || rightEvent.entityType !== "entry") {
      throw new Error("Version events must belong to content entries");
    }

    if (leftEvent.entityId !== rightEvent.entityId) {
      throw new Error("Version events must belong to the same entry");
    }

    const leftSnapshot = extractSnapshotFromPayload(leftEvent.payload);
    const rightSnapshot = extractSnapshotFromPayload(rightEvent.payload);

    if (!leftSnapshot || !rightSnapshot) {
      throw new Error("Version events are missing snapshot payloads");
    }

    return {
      leftEventId: args.leftEventId,
      rightEventId: args.rightEventId,
      leftSummary: leftEvent.summary,
      rightSummary: rightEvent.summary,
      diffs: diffContentSnapshots(leftSnapshot, rightSnapshot),
    };
  },
});

export const revertContentEntry = editorMutation({
  args: {
    entryId: v.id("contentEntries"),
    targetEventId: v.id("versionEvents"),
  },
  returns: contentEntryListItemValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Content entry not found");
    }

    const targetEvent = await ctx.db.get(args.targetEventId);
    if (!targetEvent) {
      throw new Error("Target version event not found");
    }

    if (targetEvent.entityType !== "entry" || targetEvent.entityId !== args.entryId) {
      throw new Error("Target version does not belong to this entry");
    }

    const targetSnapshot = extractSnapshotFromPayload(targetEvent.payload);
    if (!targetSnapshot) {
      throw new Error("Target version is missing a restorable snapshot");
    }

    const beforeSnapshot = buildEntrySnapshot(entry);
    const now = Date.now();
    const revertPatch = buildRevertPatch(entry, targetSnapshot, now);

    await ctx.db.patch(args.entryId, {
      ...revertPatch,
      updatedBy: roleCtx.cmsUser._id,
    });

    const updatedEntry = await ctx.db.get(args.entryId);
    if (!updatedEntry) {
      throw new Error("Content entry not found after revert");
    }

    const afterSnapshot = buildEntrySnapshot(updatedEntry);

    await recordContentHistoryEvent(ctx, {
      entryId: args.entryId,
      eventType: "reverted",
      summary: buildHistorySummary("reverted", updatedEntry.title),
      actorId: roleCtx.cmsUser._id,
      snapshot: afterSnapshot,
      timestamp: now,
      extraPayload: {
        beforeSnapshot,
        revertedToEventId: args.targetEventId,
      },
    });

    await writeAuditLog(ctx, {
      action: "content.revert",
      resourceType: "contentEntry",
      resourceId: args.entryId,
      actorId: roleCtx.cmsUser._id,
      metadata: {
        title: updatedEntry.title,
        targetEventId: args.targetEventId,
        targetSummary: targetEvent.summary,
      },
    });

    return toListItem(updatedEntry);
  },
});
