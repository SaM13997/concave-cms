import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { internalMutation } from "./_generated/server";
import { writeAuditLog } from "./lib/audit";
import { PRESENCE_TTL_MS } from "./lib/presenceConstants";
import { type AuthedRoleCtx, authedMutationWithRole, authedQueryWithRole } from "./lib/rbac";
import { presenceUserValidator } from "./lib/systemValidators";

export { PRESENCE_TTL_MS };

async function purgeExpiredSessions(ctx: MutationCtx, now: number): Promise<void> {
  const sessions = await ctx.db.query("presenceSessions").withIndex("by_expires_at").take(50);

  for (const session of sessions) {
    if (session.expiresAt <= now) {
      await ctx.db.delete(session._id);
    }
  }
}

export const heartbeat = authedMutationWithRole({
  args: {
    routePath: v.string(),
  },
  returns: v.id("presenceSessions"),
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const now = Date.now();
    const expiresAt = now + PRESENCE_TTL_MS;

    await purgeExpiredSessions(ctx, now);

    const existing = await ctx.db
      .query("presenceSessions")
      .withIndex("by_user", (q) => q.eq("userId", roleCtx.cmsUser._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        routePath: args.routePath,
        lastSeenAt: now,
        expiresAt,
      });
      return existing._id;
    }

    const sessionId = await ctx.db.insert("presenceSessions", {
      userId: roleCtx.cmsUser._id,
      routePath: args.routePath,
      lastSeenAt: now,
      expiresAt,
    });

    await writeAuditLog(ctx, {
      action: "presence.heartbeat",
      resourceType: "presenceSession",
      resourceId: sessionId,
      actorId: roleCtx.cmsUser._id,
      metadata: { routePath: args.routePath },
    });

    return sessionId;
  },
});

export const disconnect = authedMutationWithRole({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const sessions = await ctx.db
      .query("presenceSessions")
      .withIndex("by_user", (q) => q.eq("userId", roleCtx.cmsUser._id))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return null;
  },
});

export const listPresenceForRoute = authedQueryWithRole({
  args: {
    routePath: v.string(),
    now: v.number(),
  },
  returns: v.array(presenceUserValidator),
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const sessions = await ctx.db
      .query("presenceSessions")
      .withIndex("by_route", (q) => q.eq("routePath", args.routePath))
      .collect();

    const activeSessions = sessions.filter(
      (session) => session.expiresAt > args.now && session.userId !== roleCtx.cmsUser._id,
    );

    const users: Array<{
      userId: import("./_generated/dataModel").Id<"cmsUsers">;
      name: string;
      email: string;
      lastSeenAt: number;
    }> = [];

    for (const session of activeSessions) {
      const user = await ctx.db.get(session.userId);
      if (!user) {
        continue;
      }
      users.push({
        userId: user._id,
        name: user.name,
        email: user.email,
        lastSeenAt: session.lastSeenAt,
      });
    }

    return users.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  },
});

export const cleanupExpiredPresence = internalMutation({
  args: { now: v.number() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const sessions = await ctx.db.query("presenceSessions").take(200);
    let removed = 0;

    for (const session of sessions) {
      if (session.expiresAt <= args.now) {
        await ctx.db.delete(session._id);
        removed += 1;
      }
    }

    return removed;
  },
});
