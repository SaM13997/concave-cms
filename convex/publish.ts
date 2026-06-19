import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { createCorrelationId, writeAuditEvent } from "./lib/auth";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { NotFoundError } from "./lib/errors";
import { checkRateLimit } from "./lib/rateLimit";
import { entryDocValidator } from "./lib/validators";

async function recordEntryVersion(
  ctx: MutationCtx,
  entry: {
    _id: Id<"entries">;
    contentType: string;
    version: number;
    draftData: unknown;
    publishedData?: unknown;
  },
  userId: Id<"cmsUsers">,
  summary: string,
) {
  await ctx.db.insert("entryVersions", {
    entryId: entry._id,
    contentType: entry.contentType,
    version: entry.version,
    draftData: entry.draftData,
    publishedData: entry.publishedData,
    action: "published",
    changedBy: userId,
    changedAt: Date.now(),
    summary,
  });
}

export const publish = authedMutation({
  args: {
    entryId: v.id("entries"),
    expectedVersion: v.number(),
  },
  returns: v.object({
    entry: entryDocValidator,
    durationMs: v.number(),
    correlationId: v.string(),
  }),
  handler: async (ctx, args) => {
    await checkRateLimit(ctx, `publish:${ctx.user._id}`, 60);
    const startedAt = Date.now();
    const correlationId = createCorrelationId();

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new NotFoundError("Entry");
    }
    if (entry.version !== args.expectedVersion) {
      throw new Error("Entry version conflict. Refresh and try again.");
    }

    const now = Date.now();
    const nextVersion = entry.version + 1;
    await ctx.db.patch(args.entryId, {
      publishedData: entry.draftData,
      hasPublished: true,
      hasUnpublishedChanges: false,
      version: nextVersion,
      updatedBy: ctx.user._id,
      updatedAt: now,
      publishedAt: now,
      publishedBy: ctx.user._id,
    });

    const published = await ctx.db.get(args.entryId);
    if (!published) {
      throw new Error("Failed to publish entry");
    }

    await recordEntryVersion(ctx, published, ctx.user._id, "Published entry");

    const completedAt = Date.now();
    const durationMs = completedAt - startedAt;

    await ctx.db.insert("publishMetrics", {
      entryId: args.entryId,
      contentType: published.contentType,
      startedAt,
      completedAt,
      durationMs,
      correlationId,
      actorId: ctx.user._id,
    });

    await writeAuditEvent(ctx, {
      actor: ctx.user,
      action: "content.publish",
      resourceType: "content",
      resource: `${published.contentType}/${args.entryId}`,
      details: `Published entry in ${durationMs}ms`,
      correlationId,
      metadata: { durationMs },
    });

    return { entry: published, durationMs, correlationId };
  },
});

export const discardDraft = authedMutation({
  args: {
    entryId: v.id("entries"),
    expectedVersion: v.number(),
  },
  returns: entryDocValidator,
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new NotFoundError("Entry");
    }
    if (!entry.hasPublished || !entry.publishedData) {
      throw new Error("Cannot discard draft on an unpublished entry.");
    }
    if (entry.version !== args.expectedVersion) {
      throw new Error("Entry version conflict.");
    }

    await ctx.db.patch(args.entryId, {
      draftData: entry.publishedData,
      hasUnpublishedChanges: false,
      version: entry.version + 1,
      updatedBy: ctx.user._id,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(args.entryId);
    if (!updated) {
      throw new Error("Failed to discard draft");
    }
    return updated;
  },
});

export const getPublishMetrics = authedQuery({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      entryId: v.id("entries"),
      contentType: v.string(),
      durationMs: v.number(),
      completedAt: v.number(),
      correlationId: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Admin access required");
    }
    const limit = Math.min(args.limit ?? 50, 200);
    const metrics = await ctx.db
      .query("publishMetrics")
      .withIndex("by_completedAt")
      .order("desc")
      .take(limit);

    return metrics.map((m) => ({
      entryId: m.entryId,
      contentType: m.contentType,
      durationMs: m.durationMs,
      completedAt: m.completedAt,
      correlationId: m.correlationId,
    }));
  },
});
