import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { mutation, query } from "../_generated/server";
import { getCurrentCmsUser, requireAdmin, requireCmsUserWithPermission, syncCmsUser } from "./auth";
import type { Permission } from "./permissions";
import { requirePermission } from "./permissions";

export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx) => {
    const user = await getCurrentCmsUser(ctx);
    return { ctx: { ...ctx, user }, args: {} };
  },
});

export const authedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx) => {
    const user = await syncCmsUser(ctx);
    return { ctx: { ...ctx, user }, args: {} };
  },
});

export function permissionQuery(permission: Permission) {
  return customQuery(query, {
    args: {},
    input: async (ctx) => {
      const user = await requireCmsUserWithPermission(ctx, permission);
      return { ctx: { ...ctx, user }, args: {} };
    },
  });
}

export function permissionMutation(permission: Permission) {
  return customMutation(mutation, {
    args: {},
    input: async (ctx) => {
      const user = await syncCmsUser(ctx);
      requirePermission(user.role, permission);
      return { ctx: { ...ctx, user }, args: {} };
    },
  });
}

export const adminQuery = customQuery(query, {
  args: {},
  input: async (ctx) => {
    const user = await requireAdmin(ctx);
    return { ctx: { ...ctx, user }, args: {} };
  },
});

export const adminMutation = customMutation(mutation, {
  args: {},
  input: async (ctx) => {
    const user = await syncCmsUser(ctx);
    await requireAdmin(ctx);
    return { ctx: { ...ctx, user }, args: {} };
  },
});
