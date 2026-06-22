import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { writeAuditLog } from "./lib/audit";
import {
  buildEntrySnapshot,
  buildHistorySummary,
  recordContentHistoryEvent,
} from "./lib/contentHistory";
import {
  buildDiscardPatch,
  buildDraftUpdatePatch,
  buildPublishPatch,
  planDiscardDraft,
  planPublish,
} from "./lib/contentPublish";
import { getActiveSchemaBySlug, getSchemaFields } from "./lib/contentSchemas";
import { assertEntryData } from "./lib/contentValidation";
import { assertValidTitle } from "./lib/inputValidation";
import { createCorrelationId, logStructured } from "./lib/logging";
import { enforceRateLimit } from "./lib/rateLimit";
import { type AuthedRoleCtx, editorMutation, editorQuery } from "./lib/rbac";
import {
  contentEntryDetailValidator,
  contentEntryListItemValidator,
  contentTypeDescriptorValidator,
  publishResultValidator,
  referenceOptionValidator,
} from "./lib/systemValidators";

function toListItem(entry: Doc<"contentEntries">) {
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

async function preloadReferenceEntries(
  ctx: QueryCtx | MutationCtx,
  entryIds: Id<"contentEntries">[],
): Promise<Map<Id<"contentEntries">, Doc<"contentEntries"> | null>> {
  const cache = new Map<Id<"contentEntries">, Doc<"contentEntries"> | null>();
  for (const id of entryIds) {
    cache.set(id, await ctx.db.get(id));
  }
  return cache;
}

async function validateEntryDataWithContext(
  ctx: MutationCtx,
  fields: ReturnType<typeof getSchemaFields>,
  data: Record<string, unknown>,
  title?: string,
): Promise<void> {
  const referenceIds: Id<"contentEntries">[] = [];
  const mediaIds: Id<"mediaAssets">[] = [];

  const dataForValidation = { ...data };
  if (title !== undefined && fields.some((f) => f.slug === "title")) {
    dataForValidation.title = title;
  }

  for (const field of fields) {
    const value = dataForValidation[field.slug];
    if (field.type === "reference" && typeof value === "string") {
      referenceIds.push(value as Id<"contentEntries">);
    }
    if (field.type === "image" && typeof value === "string") {
      mediaIds.push(value as Id<"mediaAssets">);
    }
  }

  const refCache = await preloadReferenceEntries(ctx, referenceIds);
  const mediaCache = new Map<Id<"mediaAssets">, boolean>();
  for (const id of mediaIds) {
    const asset = await ctx.db.get(id);
    mediaCache.set(id, asset !== null);
  }

  assertEntryData(fields, dataForValidation, {
    referenceExists: (entryId, targetType) => {
      const entry = refCache.get(entryId);
      return entry !== null && entry !== undefined && entry.contentType === targetType;
    },
    mediaExists: (assetId) => mediaCache.get(assetId) ?? false,
  });
}

async function resolveReferencesAndMedia(
  ctx: QueryCtx,
  fields: ReturnType<typeof getSchemaFields>,
  data: Record<string, unknown>,
) {
  const resolvedReferences: Record<
    string,
    { _id: Id<"contentEntries">; title: string; contentType: string } | null
  > = {};
  const resolvedMedia: Record<
    string,
    { _id: Id<"mediaAssets">; filename: string; url: string | null; alt?: string } | null
  > = {};

  for (const field of fields) {
    const value = data[field.slug];

    if (field.type === "reference" && typeof value === "string") {
      const refEntry = await ctx.db.get(value as Id<"contentEntries">);
      resolvedReferences[field.slug] = refEntry
        ? { _id: refEntry._id, title: refEntry.title, contentType: refEntry.contentType }
        : null;
    }

    if (field.type === "image" && typeof value === "string") {
      const asset = await ctx.db.get(value as Id<"mediaAssets">);
      if (asset) {
        const url = asset.storageId ? await ctx.storage.getUrl(asset.storageId) : null;
        resolvedMedia[field.slug] = {
          _id: asset._id,
          filename: asset.filename,
          url,
          alt: asset.alt,
        };
      } else {
        resolvedMedia[field.slug] = null;
      }
    }
  }

  return { resolvedReferences, resolvedMedia };
}

export const listContentTypes = editorQuery({
  args: {},
  returns: v.array(contentTypeDescriptorValidator),
  handler: async (ctx) => {
    const schemas = await ctx.db
      .query("schemas")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return schemas.map((schema) => ({
      slug: schema.slug,
      name: schema.name,
      fields: schema.fields,
    }));
  },
});

export const listContentEntries = editorQuery({
  args: {
    contentType: v.optional(v.string()),
  },
  returns: v.array(contentEntryListItemValidator),
  handler: async (ctx, args) => {
    if (args.contentType) {
      const contentType = args.contentType;
      const entries = await ctx.db
        .query("contentEntries")
        .withIndex("by_content_type", (q) => q.eq("contentType", contentType))
        .order("desc")
        .take(100);
      return entries.sort((a, b) => b.updatedAt - a.updatedAt).map(toListItem);
    }

    const entries = await ctx.db
      .query("contentEntries")
      .withIndex("by_updated_at")
      .order("desc")
      .take(100);

    return entries.map(toListItem);
  },
});

export const getContentEntry = editorQuery({
  args: { entryId: v.id("contentEntries") },
  returns: v.union(contentEntryDetailValidator, v.null()),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      return null;
    }

    const schema = await getActiveSchemaBySlug(ctx, entry.contentType);
    const fields = schema ? getSchemaFields(schema) : [];
    const data = (entry.data ?? {}) as Record<string, unknown>;
    const { resolvedReferences, resolvedMedia } = await resolveReferencesAndMedia(
      ctx,
      fields,
      data,
    );

    return {
      _id: entry._id,
      _creationTime: entry._creationTime,
      contentType: entry.contentType,
      title: entry.title,
      status: entry.status,
      data: entry.data,
      publishedTitle: entry.publishedTitle,
      publishedData: entry.publishedData,
      hasUnpublishedChanges: entry.hasUnpublishedChanges,
      draftRevision: entry.draftRevision,
      publishedRevision: entry.publishedRevision,
      schemaFields: fields,
      resolvedReferences,
      resolvedMedia,
      createdBy: entry.createdBy,
      updatedBy: entry.updatedBy,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      publishedAt: entry.publishedAt,
    };
  },
});

export const listReferenceOptions = editorQuery({
  args: {
    contentType: v.string(),
    search: v.optional(v.string()),
  },
  returns: v.array(referenceOptionValidator),
  handler: async (ctx, args) => {
    const schema = await getActiveSchemaBySlug(ctx, args.contentType);
    if (!schema) {
      return [];
    }

    const entries = await ctx.db
      .query("contentEntries")
      .withIndex("by_content_type", (q) => q.eq("contentType", args.contentType))
      .take(100);

    const search = args.search?.toLowerCase().trim();
    const filtered = search
      ? entries.filter((e) => e.title.toLowerCase().includes(search))
      : entries;

    return filtered
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 50)
      .map((e) => ({
        _id: e._id,
        title: e.title,
        contentType: e.contentType,
      }));
  },
});

export const createContentEntry = editorMutation({
  args: {
    contentType: v.string(),
    title: v.string(),
    data: v.optional(v.record(v.string(), v.any())),
  },
  returns: contentEntryListItemValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const schema = await getActiveSchemaBySlug(ctx, args.contentType);
    if (!schema) {
      throw new Error(`No active schema found for content type "${args.contentType}"`);
    }

    const fields = getSchemaFields(schema);
    const data = args.data ?? {};
    const title = assertValidTitle(args.title);
    await validateEntryDataWithContext(ctx, fields, data, title);

    const now = Date.now();
    const entryData = { ...data };
    if (fields.some((f) => f.slug === "title")) {
      entryData.title = title;
    }

    const entryId = await ctx.db.insert("contentEntries", {
      contentType: args.contentType,
      title,
      status: "draft",
      data: entryData,
      draftRevision: 1,
      hasUnpublishedChanges: false,
      createdBy: roleCtx.cmsUser._id,
      updatedBy: roleCtx.cmsUser._id,
      createdAt: now,
      updatedAt: now,
    });

    await writeAuditLog(ctx, {
      action: "content.create",
      resourceType: "contentEntry",
      resourceId: entryId,
      actorId: roleCtx.cmsUser._id,
      metadata: { title, contentType: args.contentType },
    });

    const entry = await ctx.db.get(entryId);
    if (!entry) {
      throw new Error("Failed to create content entry");
    }

    await recordContentHistoryEvent(ctx, {
      entryId,
      eventType: "created",
      summary: buildHistorySummary("created", title),
      actorId: roleCtx.cmsUser._id,
      snapshot: buildEntrySnapshot(entry),
      timestamp: now,
    });

    return toListItem(entry);
  },
});

export const updateContentEntry = editorMutation({
  args: {
    entryId: v.id("contentEntries"),
    title: v.optional(v.string()),
    data: v.optional(v.record(v.string(), v.any())),
  },
  returns: contentEntryListItemValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Content entry not found");
    }

    const schema = await getActiveSchemaBySlug(ctx, entry.contentType);
    if (!schema) {
      throw new Error(`No active schema found for content type "${entry.contentType}"`);
    }

    const fields = getSchemaFields(schema);
    const mergedData =
      args.data !== undefined ? args.data : (entry.data as Record<string, unknown>);
    const title = args.title !== undefined ? assertValidTitle(args.title) : entry.title;
    await validateEntryDataWithContext(ctx, fields, mergedData, title);

    const now = Date.now();
    const entryData = { ...mergedData };
    if (fields.some((f) => f.slug === "title")) {
      entryData.title = title;
    }

    const draftPatch = buildDraftUpdatePatch(entry, title, entryData, now);

    await ctx.db.patch(args.entryId, {
      ...draftPatch,
      updatedBy: roleCtx.cmsUser._id,
    });

    await writeAuditLog(ctx, {
      action: "content.update",
      resourceType: "contentEntry",
      resourceId: args.entryId,
      actorId: roleCtx.cmsUser._id,
      metadata: { title },
    });

    const updated = await ctx.db.get(args.entryId);
    if (!updated) {
      throw new Error("Content entry not found after update");
    }

    await recordContentHistoryEvent(ctx, {
      entryId: args.entryId,
      eventType: "updated",
      summary: buildHistorySummary("updated", title),
      actorId: roleCtx.cmsUser._id,
      snapshot: buildEntrySnapshot(updated),
      timestamp: now,
    });

    return toListItem(updated);
  },
});

export const publishContentEntry = editorMutation({
  args: { entryId: v.id("contentEntries") },
  returns: publishResultValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const correlationId = createCorrelationId();
    await enforceRateLimit(ctx, "publish", roleCtx.cmsUser._id);

    logStructured("info", "content.publish.start", {
      correlationId,
      entryId: args.entryId,
      actorId: roleCtx.cmsUser._id,
    });

    const startedAt = Date.now();

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Content entry not found");
    }

    const plan = planPublish(entry);
    if (!plan.ok) {
      throw new Error(plan.reason);
    }

    const now = Date.now();
    const publishPatch = buildPublishPatch(entry, now);

    await ctx.db.patch(args.entryId, {
      ...publishPatch,
      updatedBy: roleCtx.cmsUser._id,
      updatedAt: now,
    });

    await writeAuditLog(ctx, {
      action: "content.publish",
      resourceType: "contentEntry",
      resourceId: args.entryId,
      actorId: roleCtx.cmsUser._id,
      correlationId,
      metadata: {
        title: entry.title,
        draftRevision: entry.draftRevision,
        publishedRevision: publishPatch.publishedRevision,
      },
    });

    logStructured("info", "content.publish.complete", {
      correlationId,
      entryId: args.entryId,
      publishDurationMs: Date.now() - startedAt,
    });

    const publishDurationMs = Date.now() - startedAt;

    await ctx.db.insert("publishMetrics", {
      entryId: args.entryId,
      publishDurationMs,
      timestamp: now,
      actorId: roleCtx.cmsUser._id,
    });

    const updated = await ctx.db.get(args.entryId);
    if (!updated) {
      throw new Error("Content entry not found after publish");
    }

    await recordContentHistoryEvent(ctx, {
      entryId: args.entryId,
      eventType: "published",
      summary: buildHistorySummary("published", updated.title),
      actorId: roleCtx.cmsUser._id,
      snapshot: buildEntrySnapshot(updated),
      timestamp: now,
    });

    return {
      entry: toListItem(updated),
      publishDurationMs,
    };
  },
});

export const discardDraft = editorMutation({
  args: { entryId: v.id("contentEntries") },
  returns: contentEntryListItemValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Content entry not found");
    }

    const plan = planDiscardDraft(entry);
    if (!plan.ok) {
      throw new Error(plan.reason);
    }

    const now = Date.now();
    const discardPatch = buildDiscardPatch(entry);

    await ctx.db.patch(args.entryId, {
      ...discardPatch,
      updatedBy: roleCtx.cmsUser._id,
      updatedAt: now,
    });

    await writeAuditLog(ctx, {
      action: "content.update",
      resourceType: "contentEntry",
      resourceId: args.entryId,
      actorId: roleCtx.cmsUser._id,
      metadata: { action: "discard_draft", title: discardPatch.title },
    });

    const updated = await ctx.db.get(args.entryId);
    if (!updated) {
      throw new Error("Content entry not found after discard");
    }

    await recordContentHistoryEvent(ctx, {
      entryId: args.entryId,
      eventType: "updated",
      summary: buildHistorySummary("updated", updated.title, { action: "discard_draft" }),
      actorId: roleCtx.cmsUser._id,
      snapshot: buildEntrySnapshot(updated),
      timestamp: now,
      extraPayload: { action: "discard_draft" },
    });

    return toListItem(updated);
  },
});

export const getPublishMetricsSummary = editorQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.object({
    count: v.number(),
    p50Ms: v.number(),
    p95Ms: v.number(),
    latestMs: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const metrics = await ctx.db
      .query("publishMetrics")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    if (metrics.length === 0) {
      return { count: 0, p50Ms: 0, p95Ms: 0 };
    }

    const durations = metrics.map((m) => m.publishDurationMs).sort((a, b) => a - b);
    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.min(durations.length - 1, Math.floor(durations.length * 0.95));

    return {
      count: durations.length,
      p50Ms: durations[p50Index] ?? 0,
      p95Ms: durations[p95Index] ?? 0,
      latestMs: metrics[0]?.publishDurationMs,
    };
  },
});
