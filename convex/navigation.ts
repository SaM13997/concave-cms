import { v } from "convex/values";
import { getActiveSchemaBySlug } from "./lib/contentSchemas";
import { editorQuery } from "./lib/rbac";
import { contentEntryNavSummaryValidator } from "./lib/systemValidators";

export const getContentEntryNavSummary = editorQuery({
  args: { entryId: v.id("contentEntries") },
  returns: v.union(contentEntryNavSummaryValidator, v.null()),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      return null;
    }

    const schema = await getActiveSchemaBySlug(ctx, entry.contentType);

    return {
      _id: entry._id,
      title: entry.title,
      contentType: entry.contentType,
      contentTypeName: schema?.name ?? entry.contentType,
      status: entry.status,
    };
  },
});
