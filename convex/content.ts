import { v } from "convex/values";
import { editorMutation, editorQuery } from "./lib/rbac";

const contentEntryValidator = v.object({
  title: v.string(),
  updatedAt: v.number(),
});

export const listContentEntries = editorQuery({
  args: {},
  returns: v.array(contentEntryValidator),
  handler: async (): Promise<Array<{ title: string; updatedAt: number }>> => {
    return [];
  },
});

export const createContentEntry = editorMutation({
  args: {
    title: v.string(),
  },
  returns: contentEntryValidator,
  handler: async (_ctx, args) => {
    return {
      title: args.title,
      updatedAt: Date.now(),
    };
  },
});
