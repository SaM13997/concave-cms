import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { getDraftSnapshot, getPublishedSnapshot } from "./lib/contentPublish";
import { getActiveSchemaBySlug, getSchemaFields } from "./lib/contentSchemas";
import {
  isPreviewTokenExpired,
  isPreviewTokenRevoked,
  isPreviewTokenValid,
} from "./lib/previewToken";
import { publicContentViewValidator } from "./lib/systemValidators";

async function resolveContentData(
  ctx: QueryCtx,
  contentType: string,
  data: Record<string, unknown>,
) {
  const schema = await getActiveSchemaBySlug(ctx, contentType);
  const fields = schema ? getSchemaFields(schema) : [];

  const resolvedReferences: Record<string, { title: string; contentType: string } | null> = {};
  const resolvedMedia: Record<string, { filename: string; url: string | null } | null> = {};

  for (const field of fields) {
    const value = data[field.slug];

    if (field.type === "reference" && typeof value === "string") {
      const refEntry = await ctx.db.get(value as Id<"contentEntries">);
      resolvedReferences[field.slug] = refEntry
        ? { title: refEntry.title, contentType: refEntry.contentType }
        : null;
    }

    if (field.type === "image" && typeof value === "string") {
      const asset = await ctx.db.get(value as Id<"mediaAssets">);
      if (asset) {
        const url = asset.storageId ? await ctx.storage.getUrl(asset.storageId) : null;
        resolvedMedia[field.slug] = { filename: asset.filename, url };
      } else {
        resolvedMedia[field.slug] = null;
      }
    }
  }

  return { resolvedReferences, resolvedMedia };
}

export const getPublishedContentEntry = query({
  args: { entryId: v.id("contentEntries") },
  returns: v.union(publicContentViewValidator, v.null()),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      return null;
    }

    const snapshot = getPublishedSnapshot(entry);
    if (!snapshot) {
      return null;
    }

    return {
      _id: entry._id,
      contentType: entry.contentType,
      title: snapshot.title,
      data: snapshot.data,
      publishedAt: entry.publishedAt,
      isPreview: false,
    };
  },
});

export const getPreviewContentByToken = query({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      view: publicContentViewValidator,
      resolvedReferences: v.record(
        v.string(),
        v.union(v.object({ title: v.string(), contentType: v.string() }), v.null()),
      ),
      resolvedMedia: v.record(
        v.string(),
        v.union(v.object({ filename: v.string(), url: v.union(v.string(), v.null()) }), v.null()),
      ),
      warning: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("previewTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!tokenRecord) {
      return null;
    }

    const entry = await ctx.db.get(tokenRecord.entryId);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const validation = isPreviewTokenValid({
      expiresAt: tokenRecord.expiresAt,
      revokedAt: tokenRecord.revokedAt,
      draftRevision: tokenRecord.draftRevision,
      entryDraftRevision: entry.draftRevision,
      now,
    });

    if (!validation.valid) {
      return null;
    }

    const draft = getDraftSnapshot(entry);
    const data = (draft.data ?? {}) as Record<string, unknown>;
    const { resolvedReferences, resolvedMedia } = await resolveContentData(
      ctx,
      entry.contentType,
      data,
    );

    let warning: string | undefined;
    if (tokenRecord.expiresAt - now < 60 * 60 * 1000) {
      warning = "Preview link expires within 1 hour";
    }

    return {
      view: {
        _id: entry._id,
        contentType: entry.contentType,
        title: draft.title,
        data: draft.data,
        publishedAt: entry.publishedAt,
        isPreview: true,
      },
      resolvedReferences,
      resolvedMedia,
      warning,
    };
  },
});

export const getPreviewTokenStatus = query({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      valid: v.literal(true),
      expiresAt: v.number(),
      isRevoked: v.boolean(),
      isExpired: v.boolean(),
      isStale: v.boolean(),
    }),
    v.object({
      valid: v.literal(false),
      reason: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("previewTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!tokenRecord) {
      return { valid: false as const, reason: "Preview token not found" };
    }

    const entry = await ctx.db.get(tokenRecord.entryId);
    if (!entry) {
      return { valid: false as const, reason: "Content entry not found" };
    }

    const now = Date.now();
    const isRevoked = isPreviewTokenRevoked(tokenRecord.revokedAt);
    const isExpired = isPreviewTokenExpired(tokenRecord.expiresAt, now);
    const isStale = tokenRecord.draftRevision !== entry.draftRevision;

    if (isRevoked) {
      return { valid: false as const, reason: "Preview token has been revoked" };
    }
    if (isExpired) {
      return { valid: false as const, reason: "Preview token has expired" };
    }
    if (isStale) {
      return {
        valid: false as const,
        reason: "Preview token is stale; regenerate to view latest draft",
      };
    }

    return {
      valid: true as const,
      expiresAt: tokenRecord.expiresAt,
      isRevoked,
      isExpired,
      isStale,
    };
  },
});
