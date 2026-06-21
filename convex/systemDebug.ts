import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { adminQuery } from "./lib/rbac";
import { systemTableSummaryValidator } from "./lib/systemValidators";

const auditLogItemValidator = v.object({
  _id: v.id("auditLog"),
  action: v.string(),
  resourceType: v.string(),
  resourceId: v.string(),
  actorId: v.id("cmsUsers"),
  timestamp: v.number(),
});

const versionEventItemValidator = v.object({
  _id: v.id("versionEvents"),
  entityType: v.string(),
  entityId: v.string(),
  eventType: v.string(),
  summary: v.string(),
  timestamp: v.number(),
});

const presenceItemValidator = v.object({
  _id: v.id("presenceSessions"),
  userId: v.id("cmsUsers"),
  routePath: v.string(),
  lastSeenAt: v.number(),
  expiresAt: v.number(),
});

const mediaItemValidator = v.object({
  _id: v.id("mediaAssets"),
  filename: v.string(),
  mimeType: v.string(),
  sizeBytes: v.number(),
  createdAt: v.number(),
});

const schemaVersionItemValidator = v.object({
  _id: v.id("schemaVersions"),
  schemaId: v.id("schemas"),
  version: v.number(),
  changeSummary: v.string(),
  createdAt: v.number(),
});

export const getSystemSummary = adminQuery({
  args: {},
  returns: systemTableSummaryValidator,
  handler: async (ctx) => {
    const [
      schemas,
      schemaVersions,
      contentEntries,
      versionEvents,
      mediaAssets,
      auditLog,
      presenceSessions,
    ] = await Promise.all([
      ctx.db.query("schemas").take(1000),
      ctx.db.query("schemaVersions").take(1000),
      ctx.db.query("contentEntries").take(1000),
      ctx.db.query("versionEvents").take(1000),
      ctx.db.query("mediaAssets").take(1000),
      ctx.db.query("auditLog").take(1000),
      ctx.db.query("presenceSessions").take(1000),
    ]);

    return {
      schemas: schemas.length,
      schemaVersions: schemaVersions.length,
      contentEntries: contentEntries.length,
      versionEvents: versionEvents.length,
      mediaAssets: mediaAssets.length,
      auditLog: auditLog.length,
      presenceSessions: presenceSessions.length,
    };
  },
});

export const listRecentAuditLog = adminQuery({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(auditLogItemValidator),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("auditLog")
      .withIndex("by_timestamp")
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: results.page.map((item) => ({
        _id: item._id,
        action: item.action,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        actorId: item.actorId,
        timestamp: item.timestamp,
      })),
    };
  },
});

export const listRecentVersionEvents = adminQuery({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(versionEventItemValidator),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("versionEvents")
      .withIndex("by_timestamp")
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: results.page.map((item) => ({
        _id: item._id,
        entityType: item.entityType,
        entityId: item.entityId,
        eventType: item.eventType,
        summary: item.summary,
        timestamp: item.timestamp,
      })),
    };
  },
});

export const listPresenceSessions = adminQuery({
  args: {},
  returns: v.array(presenceItemValidator),
  handler: async (ctx) => {
    const sessions = await ctx.db.query("presenceSessions").take(50);
    return sessions.map((session) => ({
      _id: session._id,
      userId: session.userId,
      routePath: session.routePath,
      lastSeenAt: session.lastSeenAt,
      expiresAt: session.expiresAt,
    }));
  },
});

export const listMediaAssets = adminQuery({
  args: {},
  returns: v.array(mediaItemValidator),
  handler: async (ctx) => {
    const assets = await ctx.db
      .query("mediaAssets")
      .withIndex("by_created_at")
      .order("desc")
      .take(50);

    return assets.map((asset) => ({
      _id: asset._id,
      filename: asset.filename,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      createdAt: asset.createdAt,
    }));
  },
});

export const listSchemaVersions = adminQuery({
  args: {},
  returns: v.array(schemaVersionItemValidator),
  handler: async (ctx) => {
    const versions = await ctx.db.query("schemaVersions").order("desc").take(50);
    return versions.map((version) => ({
      _id: version._id,
      schemaId: version.schemaId,
      version: version.version,
      changeSummary: version.changeSummary,
      createdAt: version.createdAt,
    }));
  },
});
