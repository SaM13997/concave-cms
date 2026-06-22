import type { GenericCtx } from "@convex-dev/better-auth";
import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import type { DataModel } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { authComponent } from "../auth";
import { type AuthUser, authUserValidator } from "./authValidators";

export { type AuthUser, authUserValidator };

export async function requireAuthUser(ctx: GenericCtx<DataModel>): Promise<AuthUser> {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user as AuthUser;
}

export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    return { ctx: { ...ctx, user }, args };
  },
});

export const authedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    return { ctx: { ...ctx, user }, args };
  },
});
