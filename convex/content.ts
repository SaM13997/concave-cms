import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { writeAuditLog } from "./lib/audit";
import { getActiveSchemaBySlug, getSchemaFields } from "./lib/contentSchemas";
import { assertEntryData } from "./lib/contentValidation";
import { type AuthedRoleCtx, editorMutation, editorQuery } from "./lib/rbac";
import {
  contentEntryDetailValidator,
  contentEntryListItemValidator,
  contentTypeDescriptorValidator,
  referenceOptionValidator,
} from "./lib/systemValidators";

function toListItem(entry: Doc<"contentEntries">) {
  return {
    _id: entry._id,
    _creationTime: entry._creationTime,
    contentType: entry.contentType,
    title: entry.title,
    status: entry.status,
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
    await validateEntryDataWithContext(ctx, fields, data, args.title.trim());

    if (!args.title.trim()) {
      throw new Error("Title is required");
    }

    const now = Date.now();
    const entryData = { ...data };
    if (fields.some((f) => f.slug === "title")) {
      entryData.title = args.title.trim();
    }

    const entryId = await ctx.db.insert("contentEntries", {
      contentType: args.contentType,
      title: args.title.trim(),
      status: "draft",
      data: entryData,
      createdBy: roleCtx.cmsUser._id,
      updatedBy: roleCtx.cmsUser._id,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("versionEvents", {
      entityType: "entry",
      entityId: entryId,
      eventType: "created",
      summary: `Created "${args.title}"`,
      actorId: roleCtx.cmsUser._id,
      timestamp: now,
      payload: { title: args.title, contentType: args.contentType },
    });

    await writeAuditLog(ctx, {
      action: "content.create",
      resourceType: "contentEntry",
      resourceId: entryId,
      actorId: roleCtx.cmsUser._id,
      metadata: { title: args.title, contentType: args.contentType },
    });

    const entry = await ctx.db.get(entryId);
    if (!entry) {
      throw new Error("Failed to create content entry");
    }

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
    const title = args.title !== undefined ? args.title.trim() : entry.title;
    await validateEntryDataWithContext(ctx, fields, mergedData, title);

    if (!title) {
      throw new Error("Title is required");
    }

    const now = Date.now();
    const entryData = { ...mergedData };
    if (fields.some((f) => f.slug === "title")) {
      entryData.title = title;
    }

    await ctx.db.patch(args.entryId, {
      title,
      data: entryData,
      updatedBy: roleCtx.cmsUser._id,
      updatedAt: now,
    });

    await ctx.db.insert("versionEvents", {
      entityType: "entry",
      entityId: args.entryId,
      eventType: "updated",
      summary: `Updated "${title}"`,
      actorId: roleCtx.cmsUser._id,
      timestamp: now,
      payload: { title },
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

    return toListItem(updated);
  },
});
