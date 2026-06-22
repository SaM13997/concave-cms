import { v } from "convex/values";
import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { authedMutation, authedQuery, requireAuthUser } from "./auth";
import type { AuthUser } from "./authValidators";
import { type CmsUser, getOrCreateCmsUser, requireCmsUser } from "./cmsUsers";
import {
  type Permission,
  permissionValidator,
  type Role,
  requirePermission,
  roleValidator,
} from "./permissions";

const cmsUserValidator = v.object({
  _id: v.id("cmsUsers"),
  _creationTime: v.number(),
  authUserId: v.string(),
  email: v.string(),
  name: v.string(),
  role: roleValidator,
  onboardingCompletedAt: v.optional(v.number()),
  onboardingDismissedAt: v.optional(v.number()),
});

export type AuthedRoleCtx = {
  user: AuthUser;
  cmsUser: CmsUser;
  role: Role;
};

export const authedQueryWithRole = customQuery(authedQuery, {
  args: {},
  input: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    const cmsUser = await requireCmsUser(ctx, user._id);
    return {
      ctx: { ...ctx, user, cmsUser, role: cmsUser.role } satisfies AuthedRoleCtx,
      args,
    };
  },
});

export const authedMutationWithRole = customMutation(authedMutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    const cmsUser = await getOrCreateCmsUser(ctx, user);
    return {
      ctx: { ...ctx, user, cmsUser, role: cmsUser.role } satisfies AuthedRoleCtx,
      args,
    };
  },
});

export const adminQuery = customQuery(authedQueryWithRole, {
  args: {},
  input: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    requirePermission(roleCtx.role, "schema:read");
    return { ctx, args };
  },
});

export const adminMutation = customMutation(authedMutationWithRole, {
  args: {},
  input: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    requirePermission(roleCtx.role, "schema:write");
    return { ctx, args };
  },
});

export const editorQuery = customQuery(authedQueryWithRole, {
  args: {},
  input: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    requirePermission(roleCtx.role, "content:read");
    return { ctx, args };
  },
});

export const editorMutation = customMutation(authedMutationWithRole, {
  args: {},
  input: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    requirePermission(roleCtx.role, "content:write");
    return { ctx, args };
  },
});

export type { Permission };
export { cmsUserValidator, permissionValidator };
