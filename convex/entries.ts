import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { createCorrelationId, writeAuditEvent } from "./lib/auth";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { validateEntryData, validateReferenceFields } from "./lib/entryValidation";
import { ConflictError, NotFoundError, ValidationError } from "./lib/errors";
import { checkRateLimit } from "./lib/rateLimit";
import type { SchemaField } from "./lib/schemaDescriptor";
import { entryDocValidator, entryVersionValidator, fieldErrorValidator } from "./lib/validators";

async function getActiveSchema(ctx: QueryCtx | MutationCtx, contentType: string) {
  const schema = await ctx.db
    .query("schemas")
    .withIndex("by_slug", (q) => q.eq("slug", contentType))
    .unique();
  if (!schema || schema.status !== "active") {
    throw new NotFoundError(`Active schema for "${contentType}"`);
  }
  return schema;
}

async function entryExists(ctx: QueryCtx | MutationCtx, contentType: string, entryId: string) {
  const entry = await ctx.db.get(entryId as Id<"entries">);
  if (!entry) return false;
  return entry.contentType === contentType;
}

async function validateEntryAgainstSchema(ctx: MutationCtx, fields: SchemaField[], data: unknown) {
  const result = validateEntryData(fields, data);
  if (!result.success) {
    throw new ValidationError("Entry validation failed", result.issues);
  }
  const refIssues = await validateReferenceFields(fields, result.data, (contentType, id) =>
    entryExists(ctx, contentType, id),
  );
  if (refIssues.length > 0) {
    throw new ValidationError("Reference validation failed", refIssues);
  }
  return result.data;
}

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
  action: "created" | "updated" | "published" | "reverted",
  summary: string,
) {
  await ctx.db.insert("entryVersions", {
    entryId: entry._id,
    contentType: entry.contentType,
    version: entry.version,
    draftData: entry.draftData,
    publishedData: entry.publishedData,
    action,
    changedBy: userId,
    changedAt: Date.now(),
    summary,
  });
}

function getEntryTitle(data: Record<string, unknown>): string {
  const candidates = ["title", "name", "slug"];
  for (const key of candidates) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "Untitled";
}

const entryListItemValidator = v.object({
  _id: v.id("entries"),
  contentType: v.string(),
  title: v.string(),
  status: v.union(v.literal("draft"), v.literal("published"), v.literal("published_with_draft")),
  updatedAt: v.number(),
  publishedAt: v.optional(v.number()),
  version: v.number(),
});

function deriveEntryStatus(entry: {
  hasPublished: boolean;
  hasUnpublishedChanges: boolean;
}): "draft" | "published" | "published_with_draft" {
  if (!entry.hasPublished) return "draft";
  if (entry.hasUnpublishedChanges) return "published_with_draft";
  return "published";
}

export const listByType = authedQuery({
  args: {
    contentType: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(entryListItemValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("entries")
      .withIndex("by_contentType_updatedAt", (q) => q.eq("contentType", args.contentType))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...result,
      page: result.page.map((entry) => ({
        _id: entry._id,
        contentType: entry.contentType,
        title: getEntryTitle(entry.draftData as Record<string, unknown>),
        status: deriveEntryStatus(entry),
        updatedAt: entry.updatedAt,
        publishedAt: entry.publishedAt,
        version: entry.version,
      })),
    };
  },
});

export const getById = authedQuery({
  args: { entryId: v.id("entries") },
  returns: v.union(entryDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.entryId);
  },
});

export const getPublishedByType = authedQuery({
  args: {
    contentType: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("entries"),
        contentType: v.string(),
        data: v.any(),
        publishedAt: v.optional(v.number()),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("entries")
      .withIndex("by_contentType_updatedAt", (q) => q.eq("contentType", args.contentType))
      .order("desc")
      .paginate(args.paginationOpts);

    const published = result.page.filter((entry) => entry.hasPublished && entry.publishedData);

    return {
      page: published.map((entry) => ({
        _id: entry._id,
        contentType: entry.contentType,
        data: entry.publishedData,
        publishedAt: entry.publishedAt,
      })),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const create = authedMutation({
  args: {
    contentType: v.string(),
    data: v.any(),
  },
  returns: entryDocValidator,
  handler: async (ctx, args) => {
    await checkRateLimit(ctx, `entry:create:${ctx.user._id}`, 120);
    const schema = await getActiveSchema(ctx, args.contentType);
    const validatedData = await validateEntryAgainstSchema(ctx, schema.fields, args.data);

    const now = Date.now();
    const entryId = await ctx.db.insert("entries", {
      contentType: args.contentType,
      draftData: validatedData,
      publishedData: undefined,
      hasPublished: false,
      hasUnpublishedChanges: false,
      version: 1,
      createdBy: ctx.user._id,
      updatedBy: ctx.user._id,
      createdAt: now,
      updatedAt: now,
    });

    const created = await ctx.db.get(entryId);
    if (!created) {
      throw new Error("Failed to create entry");
    }

    await recordEntryVersion(ctx, created, ctx.user._id, "created", "Created entry");
    await writeAuditEvent(ctx, {
      actor: ctx.user,
      action: "content.create",
      resourceType: "content",
      resource: `${args.contentType}/${entryId}`,
      details: `Created "${getEntryTitle(validatedData)}"`,
      correlationId: createCorrelationId(),
    });

    return created;
  },
});

export const updateDraft = authedMutation({
  args: {
    entryId: v.id("entries"),
    data: v.any(),
    expectedVersion: v.number(),
  },
  returns: v.union(
    v.object({ success: v.literal(true), entry: entryDocValidator }),
    v.object({ success: v.literal(false), issues: v.array(fieldErrorValidator) }),
  ),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new NotFoundError("Entry");
    }
    if (entry.version !== args.expectedVersion) {
      throw new ConflictError("Entry was modified by someone else. Refresh and try again.");
    }

    const schema = await getActiveSchema(ctx, entry.contentType);
    const validation = validateEntryData(schema.fields, args.data);
    if (!validation.success) {
      return {
        success: false as const,
        issues: validation.issues,
      };
    }

    const refIssues = await validateReferenceFields(
      schema.fields,
      validation.data,
      (contentType, id) => entryExists(ctx, contentType, id),
    );
    if (refIssues.length > 0) {
      return { success: false as const, issues: refIssues };
    }

    const now = Date.now();
    const nextVersion = entry.version + 1;
    await ctx.db.patch(args.entryId, {
      draftData: validation.data,
      hasUnpublishedChanges: entry.hasPublished ? true : entry.hasUnpublishedChanges,
      version: nextVersion,
      updatedBy: ctx.user._id,
      updatedAt: now,
    });

    const updated = await ctx.db.get(args.entryId);
    if (!updated) {
      throw new Error("Failed to update entry");
    }

    await recordEntryVersion(ctx, updated, ctx.user._id, "updated", "Updated draft");
    return { success: true as const, entry: updated };
  },
});

export const remove = authedMutation({
  args: { entryId: v.id("entries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new NotFoundError("Entry");
    }
    await ctx.db.delete(args.entryId);
    await writeAuditEvent(ctx, {
      actor: ctx.user,
      action: "content.delete",
      resourceType: "content",
      resource: `${entry.contentType}/${args.entryId}`,
      details: "Deleted entry",
      correlationId: createCorrelationId(),
    });
    return null;
  },
});

export const resolveReferences = authedQuery({
  args: {
    contentType: v.string(),
    entryId: v.id("entries"),
    depth: v.optional(v.number()),
  },
  returns: v.object({
    entry: entryDocValidator,
    resolved: v.record(v.string(), v.any()),
  }),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.contentType !== args.contentType) {
      throw new NotFoundError("Entry");
    }

    const schema = await getActiveSchema(ctx, entry.contentType);
    const resolved: Record<string, unknown> = {};
    const maxDepth = Math.min(args.depth ?? 1, 3);

    async function resolveData(
      fields: SchemaField[],
      data: Record<string, unknown>,
      currentDepth: number,
    ) {
      for (const field of fields) {
        if (field.type !== "reference") continue;
        const refId = data[field.slug];
        if (typeof refId !== "string") continue;
        const targetType =
          typeof field.config?.referenceTo === "string" ? field.config.referenceTo : null;
        if (!targetType) continue;

        const refEntry = await ctx.db.get(refId as Id<"entries">);
        if (!refEntry || refEntry.contentType !== targetType) continue;

        const refData = (refEntry.hasPublished ? refEntry.publishedData : refEntry.draftData) as
          | Record<string, unknown>
          | undefined;

        resolved[field.slug] = {
          _id: refEntry._id,
          contentType: refEntry.contentType,
          data: refData ?? {},
        };

        if (currentDepth < maxDepth) {
          const refSchema = await ctx.db
            .query("schemas")
            .withIndex("by_slug", (q) => q.eq("slug", targetType))
            .unique();
          if (refSchema && refData) {
            await resolveData(refSchema.fields, refData, currentDepth + 1);
          }
        }
      }
    }

    await resolveData(schema.fields, entry.draftData as Record<string, unknown>, 1);
    return { entry, resolved };
  },
});

export const listHistory = authedQuery({
  args: { entryId: v.id("entries") },
  returns: v.array(entryVersionValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("entryVersions")
      .withIndex("by_entryId", (q) => q.eq("entryId", args.entryId))
      .order("desc")
      .collect();
  },
});
