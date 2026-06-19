import { v } from "convex/values";
import { getPresenceColor, getPresenceInitials } from "./lib/auth";
import { getServerConfig } from "./lib/config";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { presenceSessionValidator } from "./lib/validators";

export const heartbeat = authedMutation({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
  },
  returns: presenceSessionValidator,
  handler: async (ctx, args) => {
    const config = getServerConfig();
    const now = Date.now();
    const expiresAt = now + config.PRESENCE_TTL_MS;

    const existing = await ctx.db
      .query("presenceSessions")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();

    for (const session of existing) {
      if (session.resourceType !== args.resourceType || session.resourceId !== args.resourceId) {
        await ctx.db.delete(session._id);
      }
    }

    const match = existing.find(
      (s) => s.resourceType === args.resourceType && s.resourceId === args.resourceId,
    );

    if (match) {
      await ctx.db.patch(match._id, { lastSeenAt: now, expiresAt });
      const updated = await ctx.db.get(match._id);
      if (!updated) {
        throw new Error("Failed to update presence session");
      }
      return updated;
    }

    const sessionId = await ctx.db.insert("presenceSessions", {
      userId: ctx.user._id,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      displayName: ctx.user.name,
      initials: getPresenceInitials(ctx.user.name),
      color: getPresenceColor(ctx.user._id),
      lastSeenAt: now,
      expiresAt,
    });

    const created = await ctx.db.get(sessionId);
    if (!created) {
      throw new Error("Failed to create presence session");
    }
    return created;
  },
});

export const disconnect = authedMutation({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("presenceSessions")
      .withIndex("by_resource", (q) =>
        q.eq("resourceType", args.resourceType).eq("resourceId", args.resourceId),
      )
      .collect();

    for (const session of sessions) {
      if (session.userId === ctx.user._id) {
        await ctx.db.delete(session._id);
      }
    }
    return null;
  },
});

export const listForResource = authedQuery({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
  },
  returns: v.array(presenceSessionValidator),
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessions = await ctx.db
      .query("presenceSessions")
      .withIndex("by_resource", (q) =>
        q.eq("resourceType", args.resourceType).eq("resourceId", args.resourceId),
      )
      .collect();

    return sessions.filter((session) => session.expiresAt > now);
  },
});
