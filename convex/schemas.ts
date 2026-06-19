import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { createCorrelationId, writeAuditEvent } from "./lib/auth";
import { adminMutation, adminQuery, authedQuery } from "./lib/customFunctions";
import { ConflictError, NotFoundError, ValidationError } from "./lib/errors";
import { checkRateLimit } from "./lib/rateLimit";
import {
  buildSchemaExportArtifact,
  type SchemaField,
  slugifyTableName,
  validateSchemaDescriptor,
  validateSchemaFields,
} from "./lib/schemaDescriptor";
import {
  fieldErrorValidator,
  schemaDocValidator,
  schemaFieldValidator,
  schemaStatusValidator,
} from "./lib/validators";

async function getSchemaBySlug(ctx: QueryCtx | MutationCtx, slug: string) {
  return await ctx.db
    .query("schemas")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

async function recordSchemaVersion(
  ctx: MutationCtx,
  schema: {
    _id: import("./_generated/dataModel").Id<"schemas">;
    slug: string;
    version: number;
    name: string;
    description?: string;
    fields: SchemaField[];
    status: "draft" | "active" | "archived";
    locked: boolean;
    descriptorVersion: number;
  },
  userId: import("./_generated/dataModel").Id<"cmsUsers">,
  action: "created" | "updated" | "schema_applied",
  summary: string,
) {
  await ctx.db.insert("schemaVersions", {
    schemaId: schema._id,
    slug: schema.slug,
    version: schema.version,
    snapshot: {
      slug: schema.slug,
      name: schema.name,
      description: schema.description,
      fields: schema.fields,
      version: schema.version,
      status: schema.status,
      locked: schema.locked,
      descriptorVersion: schema.descriptorVersion,
    },
    action,
    changedBy: userId,
    changedAt: Date.now(),
    summary,
  });
}

export const list = authedQuery({
  args: {
    status: v.optional(schemaStatusValidator),
  },
  returns: v.array(schemaDocValidator),
  handler: async (ctx, args) => {
    if (args.status) {
      const status = args.status;
      return await ctx.db
        .query("schemas")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
    }
    return await ctx.db.query("schemas").collect();
  },
});

export const getBySlug = authedQuery({
  args: { slug: v.string() },
  returns: v.union(schemaDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await getSchemaBySlug(ctx, args.slug);
  },
});

export const getById = authedQuery({
  args: { schemaId: v.id("schemas") },
  returns: v.union(schemaDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.schemaId);
  },
});

export const createTable = adminMutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: schemaDocValidator,
  handler: async (ctx, args) => {
    await checkRateLimit(ctx, `schema:create:${ctx.user._id}`, 30);
    const slug = args.slug?.trim() || slugifyTableName(args.name);
    if (!slug) {
      throw new ValidationError("Content type slug is required.");
    }

    const existing = await getSchemaBySlug(ctx, slug);
    if (existing) {
      throw new ConflictError(`Content type "${slug}" already exists.`);
    }

    const now = Date.now();
    const schemaId = await ctx.db.insert("schemas", {
      slug,
      name: args.name.trim(),
      description: args.description,
      fields: [],
      version: 1,
      status: "draft",
      locked: false,
      descriptorVersion: 1,
      createdBy: ctx.user._id,
      updatedBy: ctx.user._id,
      createdAt: now,
      updatedAt: now,
    });

    const created = await ctx.db.get(schemaId);
    if (!created) {
      throw new Error("Failed to create schema");
    }

    await recordSchemaVersion(
      ctx,
      created,
      ctx.user._id,
      "created",
      `Created content type "${created.name}"`,
    );
    await writeAuditEvent(ctx, {
      actor: ctx.user,
      action: "schema.table.create",
      resourceType: "schema",
      resource: `tables/${created.slug}`,
      details: `Created content type "${created.name}"`,
      correlationId: createCorrelationId(),
    });

    return created;
  },
});

export const updateTable = adminMutation({
  args: {
    schemaId: v.id("schemas"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    locked: v.optional(v.boolean()),
  },
  returns: schemaDocValidator,
  handler: async (ctx, args) => {
    const schema = await ctx.db.get(args.schemaId);
    if (!schema) {
      throw new NotFoundError("Schema");
    }
    if (schema.locked && args.locked !== false) {
      throw new ConflictError("This content type is locked for code-only edits.");
    }

    const now = Date.now();
    const nextVersion = schema.version + 1;
    await ctx.db.patch(args.schemaId, {
      name: args.name?.trim() ?? schema.name,
      description: args.description ?? schema.description,
      locked: args.locked ?? schema.locked,
      version: nextVersion,
      updatedBy: ctx.user._id,
      updatedAt: now,
    });

    const updated = await ctx.db.get(args.schemaId);
    if (!updated) {
      throw new Error("Failed to update schema");
    }

    await recordSchemaVersion(
      ctx,
      updated,
      ctx.user._id,
      "updated",
      `Updated content type "${updated.name}"`,
    );
    return updated;
  },
});

export const renameTable = adminMutation({
  args: {
    schemaId: v.id("schemas"),
    slug: v.string(),
    name: v.string(),
  },
  returns: schemaDocValidator,
  handler: async (ctx, args) => {
    const schema = await ctx.db.get(args.schemaId);
    if (!schema) {
      throw new NotFoundError("Schema");
    }
    if (schema.locked) {
      throw new ConflictError("Cannot rename a locked content type.");
    }

    const slug = slugifyTableName(args.slug);
    if (!slug) {
      throw new ValidationError("Invalid slug.");
    }

    const conflict = await getSchemaBySlug(ctx, slug);
    if (conflict && conflict._id !== schema._id) {
      throw new ConflictError(`Slug "${slug}" is already in use.`);
    }

    await ctx.db.patch(args.schemaId, {
      slug,
      name: args.name.trim(),
      version: schema.version + 1,
      updatedBy: ctx.user._id,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(args.schemaId);
    if (!updated) {
      throw new Error("Failed to rename schema");
    }
    await recordSchemaVersion(
      ctx,
      updated,
      ctx.user._id,
      "updated",
      `Renamed content type to "${updated.name}"`,
    );
    return updated;
  },
});

export const deleteTable = adminMutation({
  args: {
    schemaId: v.id("schemas"),
    force: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const schema = await ctx.db.get(args.schemaId);
    if (!schema) {
      throw new NotFoundError("Schema");
    }
    if (schema.locked && !args.force) {
      throw new ConflictError("Cannot delete a locked content type without force.");
    }

    const entries = await ctx.db
      .query("entries")
      .withIndex("by_contentType", (q) => q.eq("contentType", schema.slug))
      .take(1);

    if (entries.length > 0 && !args.force) {
      throw new ConflictError(
        "Content type has entries. Delete entries first or pass force: true.",
      );
    }

    await ctx.db.delete(args.schemaId);
    await writeAuditEvent(ctx, {
      actor: ctx.user,
      action: "schema.table.delete",
      resourceType: "schema",
      resource: `tables/${schema.slug}`,
      details: `Deleted content type "${schema.name}"`,
      correlationId: createCorrelationId(),
    });
    return null;
  },
});

export const replaceFields = adminMutation({
  args: {
    schemaId: v.id("schemas"),
    fields: v.array(schemaFieldValidator),
    expectedVersion: v.number(),
  },
  returns: v.union(
    v.object({ success: v.literal(true), schema: schemaDocValidator }),
    v.object({
      success: v.literal(false),
      issues: v.array(fieldErrorValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const schema = await ctx.db.get(args.schemaId);
    if (!schema) {
      throw new NotFoundError("Schema");
    }
    if (schema.locked) {
      throw new ConflictError("Cannot edit fields on a locked content type.");
    }
    if (schema.version !== args.expectedVersion) {
      throw new ConflictError("Schema was modified by someone else. Refresh and try again.");
    }

    const fieldIssues = validateSchemaFields(args.fields as SchemaField[]);
    if (fieldIssues.length > 0) {
      return {
        success: false as const,
        issues: fieldIssues.map((issue) => ({
          path: issue.path,
          message: issue.message,
          fieldId: issue.fieldId,
        })),
      };
    }

    const descriptorCheck = validateSchemaDescriptor({
      slug: schema.slug,
      name: schema.name,
      description: schema.description,
      fields: args.fields,
      version: schema.version + 1,
      status: schema.status,
      locked: schema.locked,
      descriptorVersion: schema.descriptorVersion,
    });

    if (!descriptorCheck.success) {
      return {
        success: false as const,
        issues: descriptorCheck.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
          fieldId: issue.fieldId,
        })),
      };
    }

    const now = Date.now();
    await ctx.db.patch(args.schemaId, {
      fields: args.fields,
      version: schema.version + 1,
      updatedBy: ctx.user._id,
      updatedAt: now,
    });

    const updated = await ctx.db.get(args.schemaId);
    if (!updated) {
      throw new Error("Failed to update schema fields");
    }

    await recordSchemaVersion(ctx, updated, ctx.user._id, "updated", "Updated schema fields");
    await writeAuditEvent(ctx, {
      actor: ctx.user,
      action: "schema.fields.replace",
      resourceType: "schema",
      resource: `tables/${updated.slug}`,
      details: `Updated fields for "${updated.name}"`,
      correlationId: createCorrelationId(),
    });

    return { success: true as const, schema: updated };
  },
});

export const applyDraft = adminMutation({
  args: {
    schemaId: v.id("schemas"),
    expectedVersion: v.number(),
  },
  returns: v.union(
    v.object({ success: v.literal(true), schema: schemaDocValidator }),
    v.object({
      success: v.literal(false),
      conflict: v.boolean(),
      issues: v.array(fieldErrorValidator),
    }),
  ),
  handler: async (ctx, args) => {
    await checkRateLimit(ctx, `schema:apply:${ctx.user._id}`, 20);
    const schema = await ctx.db.get(args.schemaId);
    if (!schema) {
      throw new NotFoundError("Schema");
    }
    if (schema.version !== args.expectedVersion) {
      return {
        success: false as const,
        conflict: true,
        issues: [
          {
            path: "version",
            message: "Schema version conflict. Review changes and retry apply.",
          },
        ],
      };
    }

    const validation = validateSchemaDescriptor({
      slug: schema.slug,
      name: schema.name,
      description: schema.description,
      fields: schema.fields,
      version: schema.version,
      status: "active",
      locked: schema.locked,
      descriptorVersion: schema.descriptorVersion,
    });

    if (!validation.success) {
      return {
        success: false as const,
        conflict: false,
        issues: validation.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
          fieldId: issue.fieldId,
        })),
      };
    }

    const now = Date.now();
    await ctx.db.patch(args.schemaId, {
      status: "active",
      version: schema.version + 1,
      updatedBy: ctx.user._id,
      updatedAt: now,
    });

    const applied = await ctx.db.get(args.schemaId);
    if (!applied) {
      throw new Error("Failed to apply schema");
    }

    await recordSchemaVersion(
      ctx,
      applied,
      ctx.user._id,
      "schema_applied",
      "Applied schema to active",
    );
    await writeAuditEvent(ctx, {
      actor: ctx.user,
      action: "schema.apply",
      resourceType: "schema",
      resource: `tables/${applied.slug}`,
      details: `Applied content type "${applied.name}"`,
      correlationId: createCorrelationId(),
    });

    return { success: true as const, schema: applied };
  },
});

export const exportArtifact = adminQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const schemas = await ctx.db.query("schemas").collect();
    return buildSchemaExportArtifact(schemas);
  },
});

export const importFromArtifact = adminMutation({
  args: {
    artifact: v.any(),
    mode: v.union(v.literal("merge"), v.literal("replace")),
  },
  returns: v.object({
    created: v.number(),
    updated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    await checkRateLimit(ctx, `schema:import:${ctx.user._id}`, 10);
    const artifact = args.artifact as {
      version?: number;
      tables?: Array<{
        slug: string;
        name: string;
        description?: string;
        fields: SchemaField[];
        status?: "draft" | "active" | "archived";
        locked?: boolean;
        version?: number;
      }>;
    };

    if (artifact.version !== 1 || !Array.isArray(artifact.tables)) {
      throw new ValidationError("Invalid schema export artifact.");
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const now = Date.now();

    for (const table of artifact.tables) {
      const validation = validateSchemaDescriptor({
        slug: table.slug,
        name: table.name,
        description: table.description,
        fields: table.fields,
        version: table.version ?? 1,
        status: table.status ?? "draft",
        locked: table.locked ?? false,
        descriptorVersion: 1,
      });
      if (!validation.success) {
        skipped++;
        continue;
      }

      const existing = await getSchemaBySlug(ctx, table.slug);
      if (existing) {
        if (existing.locked) {
          skipped++;
          continue;
        }
        if (args.mode === "replace" || existing.status === "draft") {
          await ctx.db.patch(existing._id, {
            name: table.name,
            description: table.description,
            fields: table.fields,
            status: table.status ?? existing.status,
            locked: table.locked ?? existing.locked,
            version: existing.version + 1,
            updatedBy: ctx.user._id,
            updatedAt: now,
          });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      const schemaId = await ctx.db.insert("schemas", {
        slug: table.slug,
        name: table.name,
        description: table.description,
        fields: table.fields,
        version: 1,
        status: table.status ?? "draft",
        locked: table.locked ?? false,
        descriptorVersion: 1,
        createdBy: ctx.user._id,
        updatedBy: ctx.user._id,
        createdAt: now,
        updatedAt: now,
      });
      const createdDoc = await ctx.db.get(schemaId);
      if (createdDoc) {
        await recordSchemaVersion(
          ctx,
          createdDoc,
          ctx.user._id,
          "created",
          "Imported from artifact",
        );
      }
      created++;
    }

    await writeAuditEvent(ctx, {
      actor: ctx.user,
      action: "schema.import",
      resourceType: "schema",
      resource: "export/import",
      details: `Imported schema artifact (${created} created, ${updated} updated, ${skipped} skipped)`,
      correlationId: createCorrelationId(),
    });

    return { created, updated, skipped };
  },
});

export const validateDescriptor = adminQuery({
  args: { schemaId: v.id("schemas") },
  returns: v.union(
    v.object({ valid: v.literal(true) }),
    v.object({ valid: v.literal(false), issues: v.array(fieldErrorValidator) }),
  ),
  handler: async (ctx, args) => {
    const schema = await ctx.db.get(args.schemaId);
    if (!schema) {
      throw new NotFoundError("Schema");
    }
    const result = validateSchemaDescriptor({
      slug: schema.slug,
      name: schema.name,
      description: schema.description,
      fields: schema.fields,
      version: schema.version,
      status: schema.status,
      locked: schema.locked,
      descriptorVersion: schema.descriptorVersion,
    });
    if (result.success) {
      return { valid: true as const };
    }
    return {
      valid: false as const,
      issues: result.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
        fieldId: issue.fieldId,
      })),
    };
  },
});
