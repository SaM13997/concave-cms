import type { MutationCtx } from "../_generated/server";

export type RateLimitBucket = "auth" | "publish" | "schema_apply" | "preview_token";

const LIMITS: Record<RateLimitBucket, { max: number; windowMs: number }> = {
  auth: { max: 20, windowMs: 60_000 },
  publish: { max: 30, windowMs: 60_000 },
  schema_apply: { max: 10, windowMs: 60_000 },
  preview_token: { max: 30, windowMs: 60_000 },
};

export class RateLimitError extends Error {
  constructor(message = "Too many requests. Please try again later.") {
    super(message);
    this.name = "RateLimitError";
  }
}

export function isWindowExpired(windowStart: number, now: number, windowMs: number): boolean {
  return now - windowStart > windowMs;
}

export function isRateLimited(count: number, max: number): boolean {
  return count >= max;
}

export async function enforceRateLimit(
  ctx: MutationCtx,
  bucket: RateLimitBucket,
  actorKey: string,
): Promise<void> {
  if (process.env.E2E_TEST_SECRET) {
    return;
  }

  const config = LIMITS[bucket];
  const key = `${bucket}:${actorKey}`;
  const now = Date.now();

  const existing = await ctx.db
    .query("rateLimitEvents")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();

  if (!existing) {
    await ctx.db.insert("rateLimitEvents", {
      key,
      windowStart: now,
      count: 1,
    });
    return;
  }

  if (isWindowExpired(existing.windowStart, now, config.windowMs)) {
    await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
    return;
  }

  if (isRateLimited(existing.count, config.max)) {
    throw new RateLimitError();
  }

  await ctx.db.patch(existing._id, { count: existing.count + 1 });
}
