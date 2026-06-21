import type { GenericCtx } from "@convex-dev/better-auth";
import { v } from "convex/values";
import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import type { DataModel } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { authComponent } from "../auth";

export const authUserValidator = v.object({
  _id: v.string(),
  name: v.string(),
  email: v.string(),
  emailVerified: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  image: v.optional(v.union(v.string(), v.null())),
});

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: number;
  updatedAt: number;
  image?: string | null;
};

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
