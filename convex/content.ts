import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { writeAuditLog } from "./lib/audit";
import { type AuthedRoleCtx, editorMutation, editorQuery } from "./lib/rbac";
import { contentEntryDetailValidator, contentEntryListItemValidator } from "./lib/systemValidators";

const DEFAULT_CONTENT_TYPE = "post";

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

export const listContentEntries = editorQuery({
  args: {},
  returns: v.array(contentEntryListItemValidator),
  handler: async (ctx) => {
    const entries = await ctx.db
      .query("contentEntries")
      .withIndex("by_updated_at")
      .order("desc")
      .take(50);

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

    return {
      _id: entry._id,
      _creationTime: entry._creationTime,
      contentType: entry.contentType,
      title: entry.title,
      status: entry.status,
      data: entry.data,
      createdBy: entry.createdBy,
      updatedBy: entry.updatedBy,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      publishedAt: entry.publishedAt,
    };
  },
});

export const createContentEntry = editorMutation({
  args: {
    title: v.string(),
    contentType: v.optional(v.string()),
  },
  returns: contentEntryListItemValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const now = Date.now();
    const contentType = args.contentType ?? DEFAULT_CONTENT_TYPE;

    const entryId = await ctx.db.insert("contentEntries", {
      contentType,
      title: args.title,
      status: "draft",
      data: {},
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
      payload: { title: args.title, contentType },
    });

    await writeAuditLog(ctx, {
      action: "content.create",
      resourceType: "contentEntry",
      resourceId: entryId,
      actorId: roleCtx.cmsUser._id,
      metadata: { title: args.title, contentType },
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
    title: v.string(),
  },
  returns: contentEntryListItemValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Content entry not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.entryId, {
      title: args.title,
      updatedBy: roleCtx.cmsUser._id,
      updatedAt: now,
    });

    await ctx.db.insert("versionEvents", {
      entityType: "entry",
      entityId: args.entryId,
      eventType: "updated",
      summary: `Updated title to "${args.title}"`,
      actorId: roleCtx.cmsUser._id,
      timestamp: now,
      payload: { title: args.title },
    });

    await writeAuditLog(ctx, {
      action: "content.update",
      resourceType: "contentEntry",
      resourceId: args.entryId,
      actorId: roleCtx.cmsUser._id,
      metadata: { title: args.title },
    });

    const updated = await ctx.db.get(args.entryId);
    if (!updated) {
      throw new Error("Content entry not found after update");
    }

    return toListItem(updated);
  },
});
