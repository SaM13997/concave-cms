import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { createCorrelationId, writeAuditEvent } from "./lib/auth";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { NotFoundError } from "./lib/errors";
import { mediaAssetValidator } from "./lib/validators";

export const list = authedQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    query: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(mediaAssetValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("mediaAssets")
      .withIndex("by_uploadedAt")
      .order("desc")
      .paginate(args.paginationOpts);

    const q = args.query?.trim().toLowerCase();
    const page = q
      ? result.page.filter(
          (asset) =>
            asset.name.toLowerCase().includes(q) ||
            asset.tags.some((tag) => tag.toLowerCase().includes(q)),
        )
      : result.page;

    return { ...result, page };
  },
});

export const getById = authedQuery({
  args: { assetId: v.id("mediaAssets") },
  returns: v.union(mediaAssetValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.assetId);
  },
});

export const createMetadata = authedMutation({
  args: {
    name: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    alt: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
  },
  returns: mediaAssetValidator,
  handler: async (ctx, args) => {
    if (!args.storageId && !args.url) {
      throw new Error("Either storageId or url is required.");
    }

    const assetId = await ctx.db.insert("mediaAssets", {
      name: args.name,
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      width: args.width,
      height: args.height,
      alt: args.alt,
      tags: args.tags ?? [],
      storageId: args.storageId,
      url: args.url,
      uploadedBy: ctx.user._id,
      uploadedAt: Date.now(),
    });

    const created = await ctx.db.get(assetId);
    if (!created) {
      throw new Error("Failed to create media asset");
    }

    await writeAuditEvent(ctx, {
      actor: ctx.user,
      action: "media.upload",
      resourceType: "media",
      resource: `media/${created._id}`,
      details: `Uploaded ${created.name}`,
      correlationId: createCorrelationId(),
    });

    return created;
  },
});

export const updateMetadata = authedMutation({
  args: {
    assetId: v.id("mediaAssets"),
    name: v.optional(v.string()),
    alt: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: mediaAssetValidator,
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throw new NotFoundError("Media asset");
    }

    await ctx.db.patch(args.assetId, {
      name: args.name ?? asset.name,
      alt: args.alt ?? asset.alt,
      tags: args.tags ?? asset.tags,
    });

    const updated = await ctx.db.get(args.assetId);
    if (!updated) {
      throw new Error("Failed to update media asset");
    }
    return updated;
  },
});

export const remove = authedMutation({
  args: { assetId: v.id("mediaAssets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throw new NotFoundError("Media asset");
    }
    await ctx.db.delete(args.assetId);
    await writeAuditEvent(ctx, {
      actor: ctx.user,
      action: "media.delete",
      resourceType: "media",
      resource: `media/${args.assetId}`,
      details: `Deleted ${asset.name}`,
      correlationId: createCorrelationId(),
    });
    return null;
  },
});

export const generateUploadUrl = authedMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
