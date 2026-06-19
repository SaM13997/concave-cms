import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { syncCmsUser } from "./lib/auth";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { cmsUserValidator } from "./lib/validators";

const authUserValidator = v.union(
  v.object({
    _id: v.string(),
    userId: v.optional(v.string()),
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.union(v.string(), v.null())),
  }),
  v.null(),
);

export const sync = mutation({
  args: {},
  returns: cmsUserValidator,
  handler: async (ctx) => {
    return await syncCmsUser(ctx);
  },
});

export const getMe = authedQuery({
  args: {},
  returns: cmsUserValidator,
  handler: async (ctx) => {
    return ctx.user;
  },
});

export const getAuthSession = query({
  args: {},
  returns: authUserValidator,
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }
    return {
      _id: user._id,
      userId: user.userId ?? undefined,
      email: user.email,
      name: user.name ?? undefined,
      image: user.image ?? undefined,
    };
  },
});

export const listTeam = authedQuery({
  args: {},
  returns: v.array(cmsUserValidator),
  handler: async (ctx) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Admin access required");
    }
    return await ctx.db.query("cmsUsers").collect();
  },
});

export const setUserRole = authedMutation({
  args: {
    userId: v.id("cmsUsers"),
    role: v.union(v.literal("admin"), v.literal("editor")),
  },
  returns: cmsUserValidator,
  handler: async (ctx, args) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Admin access required");
    }
    if (ctx.user._id === args.userId && args.role !== "admin") {
      throw new Error("Cannot demote yourself");
    }
    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });
    const updated = await ctx.db.get(args.userId);
    if (!updated) {
      throw new Error("User not found");
    }
    return updated;
  },
});

export const bootstrapSession = mutation({
  args: {},
  returns: cmsUserValidator,
  handler: async (ctx) => {
    return await syncCmsUser(ctx);
  },
});
