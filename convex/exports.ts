import { v } from "convex/values";
import { writeAuditLog } from "./lib/audit";
import { createCorrelationId, logStructured } from "./lib/logging";
import type { AuthedRoleCtx } from "./lib/rbac";
import { adminMutation, adminQuery } from "./lib/rbac";
import { exportSchemaArtifact } from "./lib/schemaExport";
import type { SchemaField } from "./lib/schemaTypes";
import { schemaFieldValidator } from "./lib/systemValidators";

const contentSnapshotEntryValidator = v.object({
  contentType: v.string(),
  title: v.string(),
  status: v.union(v.literal("draft"), v.literal("published")),
  data: v.any(),
  publishedTitle: v.optional(v.string()),
  publishedData: v.optional(v.any()),
  draftRevision: v.number(),
  publishedRevision: v.optional(v.number()),
  hasUnpublishedChanges: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  publishedAt: v.optional(v.number()),
});

const fullSnapshotValidator = v.object({
  formatVersion: v.literal(1),
  exportedAt: v.string(),
  schemas: v.array(
    v.object({
      slug: v.string(),
      name: v.string(),
      descriptorVersion: v.number(),
      fields: v.array(schemaFieldValidator),
    }),
  ),
  contentEntries: v.array(contentSnapshotEntryValidator),
});

export const exportContentSnapshot = adminQuery({
  args: {},
  returns: v.object({
    formatVersion: v.literal(1),
    exportedAt: v.string(),
    entries: v.array(contentSnapshotEntryValidator),
  }),
  handler: async (ctx) => {
    const entries = await ctx.db
      .query("contentEntries")
      .withIndex("by_updated_at")
      .order("desc")
      .take(5000);

    return {
      formatVersion: 1 as const,
      exportedAt: new Date().toISOString(),
      entries: entries.map((entry) => ({
        contentType: entry.contentType,
        title: entry.title,
        status: entry.status,
        data: entry.data,
        publishedTitle: entry.publishedTitle,
        publishedData: entry.publishedData,
        draftRevision: entry.draftRevision,
        publishedRevision: entry.publishedRevision,
        hasUnpublishedChanges: entry.hasUnpublishedChanges,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        publishedAt: entry.publishedAt,
      })),
    };
  },
});

export const exportFullSnapshot = adminQuery({
  args: {},
  returns: fullSnapshotValidator,
  handler: async (ctx) => {
    const [activeSchemas, entries] = await Promise.all([
      ctx.db
        .query("schemas")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect(),
      ctx.db.query("contentEntries").withIndex("by_updated_at").order("desc").take(5000),
    ]);

    const schemaArtifact = exportSchemaArtifact(
      activeSchemas.map((schema) => ({
        slug: schema.slug,
        name: schema.name,
        fields: schema.fields,
        descriptorVersion: schema.descriptorVersion,
      })),
    );

    return {
      formatVersion: 1 as const,
      exportedAt: new Date().toISOString(),
      schemas: schemaArtifact.schemas.map((schema) => ({
        slug: schema.slug,
        name: schema.name,
        descriptorVersion: schema.descriptorVersion,
        fields: schema.fields.map((field) => ({
          slug: field.slug,
          name: field.name,
          type: field.type as SchemaField["type"],
          required: field.required,
          config: field.config,
        })),
      })),
      contentEntries: entries.map((entry) => ({
        contentType: entry.contentType,
        title: entry.title,
        status: entry.status,
        data: entry.data,
        publishedTitle: entry.publishedTitle,
        publishedData: entry.publishedData,
        draftRevision: entry.draftRevision,
        publishedRevision: entry.publishedRevision,
        hasUnpublishedChanges: entry.hasUnpublishedChanges,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        publishedAt: entry.publishedAt,
      })),
    };
  },
});

export const restoreContentSnapshot = adminMutation({
  args: {
    entries: v.array(contentSnapshotEntryValidator),
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    restored: v.number(),
    skipped: v.number(),
    dryRun: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const correlationId = createCorrelationId();
    const dryRun = args.dryRun ?? false;
    let restored = 0;
    let skipped = 0;

    logStructured("info", "restore.content_snapshot.start", {
      correlationId,
      actorId: roleCtx.cmsUser._id,
      entryCount: args.entries.length,
      dryRun,
    });

    for (const entry of args.entries) {
      const sameTypeEntries = await ctx.db
        .query("contentEntries")
        .withIndex("by_content_type", (q) => q.eq("contentType", entry.contentType))
        .take(500);

      const existing = sameTypeEntries.find((candidate) => candidate.title === entry.title);

      if (existing) {
        skipped += 1;
        continue;
      }

      if (!dryRun) {
        const entryId = await ctx.db.insert("contentEntries", {
          contentType: entry.contentType,
          title: entry.title,
          status: entry.status,
          data: entry.data,
          publishedTitle: entry.publishedTitle,
          publishedData: entry.publishedData,
          draftRevision: entry.draftRevision,
          publishedRevision: entry.publishedRevision,
          hasUnpublishedChanges: entry.hasUnpublishedChanges,
          createdBy: roleCtx.cmsUser._id,
          updatedBy: roleCtx.cmsUser._id,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          publishedAt: entry.publishedAt,
        });

        await writeAuditLog(ctx, {
          action: "content.create",
          resourceType: "contentEntry",
          resourceId: entryId,
          actorId: roleCtx.cmsUser._id,
          correlationId,
          metadata: { restored: true, title: entry.title, contentType: entry.contentType },
        });
      }

      restored += 1;
    }

    logStructured("info", "restore.content_snapshot.complete", {
      correlationId,
      restored,
      skipped,
      dryRun,
    });

    return { restored, skipped, dryRun };
  },
});
