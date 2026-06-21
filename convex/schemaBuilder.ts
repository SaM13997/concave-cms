import { v } from "convex/values";
import { adminMutation, adminQuery } from "./lib/rbac";

const schemaDraftValidator = v.object({
  name: v.string(),
  updatedAt: v.number(),
});

export const getSchemaDraft = adminQuery({
  args: {},
  returns: v.union(schemaDraftValidator, v.null()),
  handler: async (): Promise<{ name: string; updatedAt: number } | null> => {
    return null;
  },
});

export const updateSchemaDraft = adminMutation({
  args: {
    name: v.string(),
  },
  returns: schemaDraftValidator,
  handler: async (_ctx, args) => {
    return {
      name: args.name,
      updatedAt: Date.now(),
    };
  },
});
