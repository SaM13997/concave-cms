import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { authedQuery } from "./lib/customFunctions";
import { auditEventValidator, auditResourceTypeValidator } from "./lib/validators";

export const list = authedQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    resourceType: v.optional(auditResourceTypeValidator),
    actorEmail: v.optional(v.string()),
    query: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(auditEventValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const result = await ctx.db
      .query("auditLog")
      .withIndex("by_timestamp")
      .order("desc")
      .paginate(args.paginationOpts);

    const q = args.query?.trim().toLowerCase();
    const actorFilter = args.actorEmail?.trim().toLowerCase();

    const page = result.page.filter((event) => {
      if (args.resourceType && event.resourceType !== args.resourceType) {
        return false;
      }
      if (actorFilter && !event.actorEmail.toLowerCase().includes(actorFilter)) {
        return false;
      }
      if (!q) return true;
      const haystack = `${event.action} ${event.resource} ${event.details} ${event.actorName}`;
      return haystack.toLowerCase().includes(q);
    });

    return { ...result, page };
  },
});

export const getByCorrelationId = authedQuery({
  args: { correlationId: v.string() },
  returns: v.array(auditEventValidator),
  handler: async (ctx, args) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const events = await ctx.db.query("auditLog").collect();
    return events.filter((event) => event.correlationId === args.correlationId);
  },
});
