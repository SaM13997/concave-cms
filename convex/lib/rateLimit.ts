import type { MutationCtx } from "../_generated/server";
import { getServerConfig } from "./config";

export async function checkRateLimit(
  ctx: MutationCtx,
  bucketKey: string,
  maxRequests?: number,
): Promise<void> {
  const config = getServerConfig();
  const limit = maxRequests ?? config.RATE_LIMIT_MAX_REQUESTS;
  const windowMs = config.RATE_LIMIT_WINDOW_MS;
  const now = Date.now();

  const existing = await ctx.db
    .query("rateLimitBuckets")
    .withIndex("by_key", (q) => q.eq("key", bucketKey))
    .unique();

  if (!existing) {
    await ctx.db.insert("rateLimitBuckets", {
      key: bucketKey,
      count: 1,
      windowStart: now,
    });
    return;
  }

  if (now - existing.windowStart > windowMs) {
    await ctx.db.patch(existing._id, { count: 1, windowStart: now });
    return;
  }

  if (existing.count >= limit) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  await ctx.db.patch(existing._id, { count: existing.count + 1 });
}
