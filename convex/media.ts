import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { writeAuditLog } from "./lib/audit";
import { type AuthedRoleCtx, editorMutation, editorQuery } from "./lib/rbac";
import { mediaAssetListItemValidator } from "./lib/systemValidators";

async function toMediaListItem(
  ctx: { storage: { getUrl: (id: string) => Promise<string | null> } },
  asset: Doc<"mediaAssets">,
) {
  const url = asset.storageId ? await ctx.storage.getUrl(asset.storageId) : null;
  return {
    _id: asset._id,
    _creationTime: asset._creationTime,
    filename: asset.filename,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    alt: asset.alt,
    url,
    createdAt: asset.createdAt,
  };
}

export const generateUploadUrl = editorMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createMediaAsset = editorMutation({
  args: {
    storageId: v.string(),
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    alt: v.optional(v.string()),
  },
  returns: mediaAssetListItemValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const now = Date.now();

    const assetId = await ctx.db.insert("mediaAssets", {
      filename: args.filename,
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      storageId: args.storageId,
      alt: args.alt,
      uploadedBy: roleCtx.cmsUser._id,
      createdAt: now,
    });

    await writeAuditLog(ctx, {
      action: "media.upload",
      resourceType: "mediaAsset",
      resourceId: assetId,
      actorId: roleCtx.cmsUser._id,
      metadata: { filename: args.filename, mimeType: args.mimeType },
    });

    const asset = await ctx.db.get(assetId);
    if (!asset) {
      throw new Error("Failed to create media asset");
    }

    return await toMediaListItem(ctx, asset);
  },
});

export const listMediaAssets = editorQuery({
  args: {
    search: v.optional(v.string()),
  },
  returns: v.array(mediaAssetListItemValidator),
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("mediaAssets")
      .withIndex("by_created_at")
      .order("desc")
      .take(100);

    const search = args.search?.toLowerCase().trim();
    const filtered = search
      ? assets.filter(
          (a) =>
            a.filename.toLowerCase().includes(search) ||
            (a.alt?.toLowerCase().includes(search) ?? false),
        )
      : assets;

    const items = [];
    for (const asset of filtered.slice(0, 50)) {
      items.push(await toMediaListItem(ctx, asset));
    }
    return items;
  },
});

export const getMediaAsset = editorQuery({
  args: { assetId: v.id("mediaAssets") },
  returns: v.union(mediaAssetListItemValidator, v.null()),
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      return null;
    }
    return await toMediaListItem(ctx, asset);
  },
});
