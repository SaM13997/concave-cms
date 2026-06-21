import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { authedQuery, requireAuthUser } from "./lib/auth";
import { getCmsUserByAuthId, getOrCreateCmsUser, setCmsUserRole } from "./lib/cmsUsers";
import type { Role } from "./lib/permissions";
import { permissionsForRole, roleValidator } from "./lib/permissions";
import { authedMutationWithRole, cmsUserValidator } from "./lib/rbac";

function isValidE2eSecret(secret: string): boolean {
  const allowed = new Set(
    [process.env.E2E_TEST_SECRET, "e2e-test-secret-value-32chars"].filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    ),
  );
  return allowed.has(secret);
}

export const ensureProfile = authedMutationWithRole({
  args: {},
  returns: cmsUserValidator,
  handler: async (ctx) => {
    return ctx.cmsUser;
  },
});

export const getMyRole = authedQuery({
  args: {},
  returns: v.object({
    role: roleValidator,
    permissions: v.array(
      v.union(
        v.literal("schema:read"),
        v.literal("schema:write"),
        v.literal("content:read"),
        v.literal("content:write"),
      ),
    ),
  }),
  handler: async (ctx) => {
    const user = await requireAuthUser(ctx);
    const cmsUser = await getCmsUserByAuthId(ctx, user._id);
    const role = cmsUser?.role ?? "editor";
    return {
      role,
      permissions: [...permissionsForRole(role)],
    };
  },
});

export const setRoleForTesting = internalMutation({
  args: {
    authUserId: v.string(),
    role: roleValidator,
    secret: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!isValidE2eSecret(args.secret)) {
      throw new Error("Unauthorized");
    }

    const cmsUser = await ctx.db
      .query("cmsUsers")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.authUserId))
      .unique();

    if (!cmsUser) {
      throw new Error("CMS user not found");
    }

    await setCmsUserRole(ctx, cmsUser._id, args.role as Role);
    return null;
  },
});

export const assignRoleForE2e = mutation({
  args: {
    role: roleValidator,
    secret: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!isValidE2eSecret(args.secret)) {
      throw new Error("Unauthorized");
    }

    const user = await requireAuthUser(ctx);
    const cmsUser = await getOrCreateCmsUser(ctx, user);
    await setCmsUserRole(ctx, cmsUser._id, args.role as Role);
    return null;
  },
});
