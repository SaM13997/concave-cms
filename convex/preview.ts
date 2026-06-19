import { v } from "convex/values";
import { query } from "./_generated/server";
import { createCorrelationId, writeAuditEvent } from "./lib/auth";
import { getServerConfig } from "./lib/config";
import { authedMutation } from "./lib/customFunctions";
import { NotFoundError } from "./lib/errors";
import { checkRateLimit } from "./lib/rateLimit";

function generatePreviewToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const createToken = authedMutation({
  args: { entryId: v.id("entries") },
  returns: v.object({
    token: v.string(),
    expiresAt: v.number(),
    previewPath: v.string(),
  }),
  handler: async (ctx, args) => {
    await checkRateLimit(ctx, `preview:create:${ctx.user._id}`, 30);
    getServerConfig();

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new NotFoundError("Entry");
    }

    const now = Date.now();
    const config = getServerConfig();
    const expiresAt = now + config.PREVIEW_TOKEN_TTL_MS;
    const token = generatePreviewToken();

    await ctx.db.insert("previewTokens", {
      entryId: args.entryId,
      token,
      createdBy: ctx.user._id,
      createdAt: now,
      expiresAt,
    });

    await writeAuditEvent(ctx, {
      actor: ctx.user,
      action: "preview.create",
      resourceType: "content",
      resource: `${entry.contentType}/${args.entryId}`,
      details: "Created preview token",
      correlationId: createCorrelationId(),
    });

    return {
      token,
      expiresAt,
      previewPath: `/preview/${entry.contentType}/${args.entryId}?token=${token}`,
    };
  },
});

export const revokeToken = authedMutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("previewTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!record) {
      throw new NotFoundError("Preview token");
    }
    await ctx.db.patch(record._id, { revokedAt: Date.now() });
    return null;
  },
});

export const revokeAllForEntry = authedMutation({
  args: { entryId: v.id("entries") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("previewTokens")
      .withIndex("by_entryId", (q) => q.eq("entryId", args.entryId))
      .collect();

    let revoked = 0;
    const now = Date.now();
    for (const token of tokens) {
      if (!token.revokedAt) {
        await ctx.db.patch(token._id, { revokedAt: now });
        revoked++;
      }
    }
    return revoked;
  },
});

export const getDraftByToken = query({
  args: {
    entryId: v.id("entries"),
    token: v.string(),
  },
  returns: v.union(
    v.object({
      entryId: v.id("entries"),
      contentType: v.string(),
      draftData: v.any(),
      expiresAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("previewTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!tokenRecord || tokenRecord.entryId !== args.entryId) {
      return null;
    }
    if (tokenRecord.revokedAt) {
      return null;
    }
    if (tokenRecord.expiresAt < Date.now()) {
      return null;
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      return null;
    }

    return {
      entryId: entry._id,
      contentType: entry.contentType,
      draftData: entry.draftData,
      expiresAt: tokenRecord.expiresAt,
    };
  },
});

export const listTokensForEntry = authedMutation({
  args: { entryId: v.id("entries") },
  returns: v.array(
    v.object({
      token: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
      revokedAt: v.optional(v.number()),
      active: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("previewTokens")
      .withIndex("by_entryId", (q) => q.eq("entryId", args.entryId))
      .collect();

    const now = Date.now();
    return tokens.map((t) => ({
      token: t.token,
      createdAt: t.createdAt,
      expiresAt: t.expiresAt,
      revokedAt: t.revokedAt,
      active: !t.revokedAt && t.expiresAt > now,
    }));
  },
});
