import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { adminQuery } from "./lib/rbac";
import { auditActionValidator } from "./lib/systemValidators";

const auditLogListItemValidator = v.object({
  _id: v.id("auditLog"),
  action: auditActionValidator,
  resourceType: v.string(),
  resourceId: v.string(),
  actorId: v.id("cmsUsers"),
  actorName: v.string(),
  actorEmail: v.string(),
  timestamp: v.number(),
  metadata: v.any(),
});

const paginatedAuditLogValidator = v.object({
  page: v.array(auditLogListItemValidator),
  isDone: v.boolean(),
  continueCursor: v.union(v.string(), v.null()),
  pageStatus: v.optional(v.union(v.string(), v.null())),
  splitCursor: v.optional(v.union(v.string(), v.null())),
});

const auditLogDetailValidator = v.object({
  _id: v.id("auditLog"),
  action: auditActionValidator,
  resourceType: v.string(),
  resourceId: v.string(),
  actorId: v.id("cmsUsers"),
  actorName: v.string(),
  actorEmail: v.string(),
  timestamp: v.number(),
  metadata: v.any(),
});

async function enrichAuditLogItem(ctx: QueryCtx, item: Doc<"auditLog">) {
  const actor = await ctx.db.get(item.actorId);
  return {
    _id: item._id,
    action: item.action,
    resourceType: item.resourceType,
    resourceId: item.resourceId,
    actorId: item.actorId,
    actorName: actor?.name ?? "Unknown",
    actorEmail: actor?.email ?? "unknown",
    timestamp: item.timestamp,
    metadata: item.metadata ?? {},
  };
}

function matchesAuditFilters(
  item: { action: string; resourceType: string; timestamp: number },
  filters: {
    action?: string;
    resourceType?: string;
    startTime?: number;
    endTime?: number;
  },
): boolean {
  if (filters.action && item.action !== filters.action) {
    return false;
  }
  if (filters.resourceType && item.resourceType !== filters.resourceType) {
    return false;
  }
  if (filters.startTime !== undefined && item.timestamp < filters.startTime) {
    return false;
  }
  if (filters.endTime !== undefined && item.timestamp > filters.endTime) {
    return false;
  }
  return true;
}

export const listAuditLog = adminQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    action: v.optional(auditActionValidator),
    actorId: v.optional(v.id("cmsUsers")),
    resourceType: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  returns: paginatedAuditLogValidator,
  handler: async (ctx, args) => {
    const filters = {
      action: args.action,
      resourceType: args.resourceType,
      startTime: args.startTime,
      endTime: args.endTime,
    };

    const actorId = args.actorId;
    const results = actorId
      ? await ctx.db
          .query("auditLog")
          .withIndex("by_actor", (q) => q.eq("actorId", actorId))
          .order("desc")
          .paginate(args.paginationOpts)
      : await ctx.db
          .query("auditLog")
          .withIndex("by_timestamp")
          .order("desc")
          .paginate(args.paginationOpts);

    const filteredPage = results.page.filter((item) => matchesAuditFilters(item, filters));
    const page = await Promise.all(filteredPage.map((item) => enrichAuditLogItem(ctx, item)));

    return {
      ...results,
      page,
    };
  },
});

export const getAuditLogEntry = adminQuery({
  args: { auditLogId: v.id("auditLog") },
  returns: v.union(auditLogDetailValidator, v.null()),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.auditLogId);
    if (!item) {
      return null;
    }

    return enrichAuditLogItem(ctx, item);
  },
});

export const listAuditActions = adminQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async () => {
    return [
      "schema.create",
      "schema.update",
      "schema.apply",
      "content.create",
      "content.update",
      "content.publish",
      "content.revert",
      "media.upload",
      "presence.heartbeat",
    ];
  },
});
