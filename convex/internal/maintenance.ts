import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const cleanupExpiredSessions = internalMutation({
  args: {},
  returns: v.object({
    presenceRemoved: v.number(),
    previewTokensRemoved: v.number(),
    rateLimitBucketsRemoved: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    let presenceRemoved = 0;
    let previewTokensRemoved = 0;
    let rateLimitBucketsRemoved = 0;

    const presence = await ctx.db.query("presenceSessions").collect();
    for (const session of presence) {
      if (session.expiresAt <= now) {
        await ctx.db.delete(session._id);
        presenceRemoved++;
      }
    }

    const tokens = await ctx.db.query("previewTokens").collect();
    for (const token of tokens) {
      if (token.expiresAt <= now || token.revokedAt) {
        await ctx.db.delete(token._id);
        previewTokensRemoved++;
      }
    }

    const buckets = await ctx.db.query("rateLimitBuckets").collect();
    for (const bucket of buckets) {
      if (now - bucket.windowStart > 3_600_000) {
        await ctx.db.delete(bucket._id);
        rateLimitBucketsRemoved++;
      }
    }

    return { presenceRemoved, previewTokensRemoved, rateLimitBucketsRemoved };
  },
});
