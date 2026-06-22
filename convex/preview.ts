import { v } from "convex/values";
import {
  DEFAULT_PREVIEW_TTL_MS,
  generatePreviewTokenValue,
  isPreviewTokenExpired,
  isPreviewTokenRevoked,
} from "./lib/previewToken";
import { type AuthedRoleCtx, editorMutation, editorQuery } from "./lib/rbac";
import { previewTokenListItemValidator } from "./lib/systemValidators";

export const listPreviewTokens = editorQuery({
  args: { entryId: v.id("contentEntries") },
  returns: v.array(previewTokenListItemValidator),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      return [];
    }

    const tokens = await ctx.db
      .query("previewTokens")
      .withIndex("by_entry", (q) => q.eq("entryId", args.entryId))
      .collect();

    const now = Date.now();
    return tokens
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((token) => ({
        _id: token._id,
        token: token.token,
        draftRevision: token.draftRevision,
        expiresAt: token.expiresAt,
        revokedAt: token.revokedAt,
        createdAt: token.createdAt,
        isExpired: isPreviewTokenExpired(token.expiresAt, now),
        isRevoked: isPreviewTokenRevoked(token.revokedAt),
        isStale: token.draftRevision !== entry.draftRevision,
      }));
  },
});

export const generatePreviewToken = editorMutation({
  args: {
    entryId: v.id("contentEntries"),
    ttlMs: v.optional(v.number()),
    revokeExisting: v.optional(v.boolean()),
  },
  returns: v.object({
    token: v.string(),
    expiresAt: v.number(),
    previewPath: v.string(),
  }),
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Content entry not found");
    }

    const now = Date.now();
    const ttlMs = args.ttlMs ?? DEFAULT_PREVIEW_TTL_MS;
    const expiresAt = now + ttlMs;

    if (args.revokeExisting) {
      const existing = await ctx.db
        .query("previewTokens")
        .withIndex("by_entry", (q) => q.eq("entryId", args.entryId))
        .collect();

      for (const token of existing) {
        if (!token.revokedAt) {
          await ctx.db.patch(token._id, { revokedAt: now });
        }
      }
    }

    const token = generatePreviewTokenValue();
    await ctx.db.insert("previewTokens", {
      entryId: args.entryId,
      token,
      draftRevision: entry.draftRevision,
      expiresAt,
      createdBy: roleCtx.cmsUser._id,
      createdAt: now,
    });

    return {
      token,
      expiresAt,
      previewPath: `/preview/${token}`,
    };
  },
});

export const revokePreviewToken = editorMutation({
  args: { tokenId: v.id("previewTokens") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db.get(args.tokenId);
    if (!tokenRecord) {
      throw new Error("Preview token not found");
    }

    if (!tokenRecord.revokedAt) {
      await ctx.db.patch(args.tokenId, { revokedAt: Date.now() });
    }

    return null;
  },
});

export const revokeAllPreviewTokens = editorMutation({
  args: { entryId: v.id("contentEntries") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("previewTokens")
      .withIndex("by_entry", (q) => q.eq("entryId", args.entryId))
      .collect();

    const now = Date.now();
    let revoked = 0;

    for (const token of tokens) {
      if (!token.revokedAt) {
        await ctx.db.patch(token._id, { revokedAt: now });
        revoked += 1;
      }
    }

    return revoked;
  },
});
