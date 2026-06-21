import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { writeAuditLog } from "./lib/audit";
import { type AuthedRoleCtx, adminMutation, adminQuery } from "./lib/rbac";
import { planSchemaApply } from "./lib/schemaApply";
import { countEntriesWithField } from "./lib/schemaDestructive";
import { diffSchemaVersions } from "./lib/schemaDiff";
import { exportSchemaArtifact } from "./lib/schemaExport";
import { validateSchemaDescriptor } from "./lib/schemaInvariants";
import type { SchemaField } from "./lib/schemaTypes";
import {
  destructiveChangeValidator,
  schemaDescriptorValidator,
  schemaFieldValidator,
  schemaListItemValidator,
  schemaStatusValidator,
  schemaValidationErrorValidator,
} from "./lib/systemValidators";

const builderTableValidator = v.object({
  _id: v.id("schemas"),
  slug: v.string(),
  name: v.string(),
  fields: v.array(schemaFieldValidator),
  status: schemaStatusValidator,
  version: v.number(),
  baseActiveVersion: v.optional(v.number()),
  hasUnpublishedChanges: v.boolean(),
  updatedAt: v.number(),
});

async function getActiveSchemaSlugs(ctx: QueryCtx | MutationCtx): Promise<string[]> {
  const activeSchemas = await ctx.db
    .query("schemas")
    .withIndex("by_status", (q) => q.eq("status", "active"))
    .collect();
  return activeSchemas.map((schema) => schema.slug);
}

function getWorkingFields(schema: Doc<"schemas">): SchemaField[] {
  if (schema.status === "active" && schema.draftFields) {
    return schema.draftFields;
  }
  return schema.fields;
}

function getWorkingName(schema: Doc<"schemas">): string {
  if (schema.status === "active" && schema.draftName) {
    return schema.draftName;
  }
  return schema.name;
}

function hasUnpublishedChanges(schema: Doc<"schemas">): boolean {
  if (schema.status === "draft" || schema.status === "apply_failed") {
    return true;
  }
  return schema.draftFields !== undefined;
}

function toBuilderTable(schema: Doc<"schemas">) {
  return {
    _id: schema._id,
    slug: schema.slug,
    name: getWorkingName(schema),
    fields: getWorkingFields(schema),
    status: schema.status,
    version: schema.version,
    baseActiveVersion: schema.baseActiveVersion,
    hasUnpublishedChanges: hasUnpublishedChanges(schema),
    updatedAt: schema.updatedAt,
  };
}

async function getSchemaOrThrow(ctx: MutationCtx, schemaId: Id<"schemas">) {
  const schema = await ctx.db.get(schemaId);
  if (!schema) {
    throw new Error("Schema not found");
  }
  return schema;
}

async function countContentEntries(ctx: QueryCtx | MutationCtx, contentType: string) {
  const entries = await ctx.db
    .query("contentEntries")
    .withIndex("by_content_type", (q) => q.eq("contentType", contentType))
    .collect();
  return entries;
}

export const listSchemas = adminQuery({
  args: {
    status: v.optional(schemaStatusValidator),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(schemaListItemValidator),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db.query("schemas").order("desc");
    if (args.status) {
      const status = args.status;
      query = ctx.db
        .query("schemas")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc");
    }

    const results = await query.paginate(args.paginationOpts);
    return {
      ...results,
      page: results.page.map((schema) => ({
        _id: schema._id,
        _creationTime: schema._creationTime,
        slug: schema.slug,
        name: schema.name,
        status: schema.status,
        version: schema.version,
        updatedAt: schema.updatedAt,
      })),
    };
  },
});

export const getBuilderState = adminQuery({
  args: {},
  returns: v.object({
    tables: v.array(builderTableValidator),
    activeSlugs: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const schemas = await ctx.db.query("schemas").order("desc").collect();
    const activeSlugs = await getActiveSchemaSlugs(ctx);
    return {
      tables: schemas.map(toBuilderTable),
      activeSlugs,
    };
  },
});

export const getSchemaBySlug = adminQuery({
  args: { slug: v.string() },
  returns: v.union(schemaDescriptorValidator, v.null()),
  handler: async (ctx, args) => {
    const schema = await ctx.db
      .query("schemas")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!schema) {
      return null;
    }

    return {
      slug: schema.slug,
      name: getWorkingName(schema),
      fields: getWorkingFields(schema),
      descriptorVersion: schema.descriptorVersion,
      version: schema.version,
      status: schema.status,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
    };
  },
});

export const getSchemaDraft = adminQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("schemas"),
      name: v.string(),
      slug: v.string(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const draft = await ctx.db
      .query("schemas")
      .withIndex("by_status", (q) => q.eq("status", "draft"))
      .order("desc")
      .first();

    if (!draft) {
      return null;
    }

    return {
      _id: draft._id,
      name: draft.name,
      slug: draft.slug,
      updatedAt: draft.updatedAt,
    };
  },
});

export const validateSchema = adminQuery({
  args: { schemaId: v.id("schemas") },
  returns: v.array(schemaValidationErrorValidator),
  handler: async (ctx, args) => {
    const schema = await ctx.db.get(args.schemaId);
    if (!schema) {
      return [{ code: "NOT_FOUND", message: "Schema not found" }];
    }
    const activeSlugs = await getActiveSchemaSlugs(ctx);
    return validateSchemaDescriptor(
      {
        slug: schema.slug,
        name: getWorkingName(schema),
        fields: getWorkingFields(schema),
        status: "active",
      },
      activeSlugs.filter((s) => s !== schema.slug),
    );
  },
});

export const exportSchemas = adminQuery({
  args: { exportedAt: v.optional(v.string()) },
  returns: v.object({
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
  }),
  handler: async (ctx, args) => {
    const activeSchemas = await ctx.db
      .query("schemas")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const artifact = exportSchemaArtifact(
      activeSchemas.map((s) => ({
        slug: s.slug,
        name: s.name,
        fields: s.fields,
        descriptorVersion: s.descriptorVersion,
      })),
      args.exportedAt ?? new Date(0).toISOString(),
    );

    return {
      formatVersion: 1 as const,
      exportedAt: artifact.exportedAt,
      schemas: artifact.schemas.map((s) => ({
        slug: s.slug,
        name: s.name,
        descriptorVersion: s.descriptorVersion,
        fields: s.fields.map((f) => ({
          slug: f.slug,
          name: f.name,
          type: f.type as SchemaField["type"],
          required: f.required,
          config: f.config,
        })),
      })),
    };
  },
});

export const getSchemaDiff = adminQuery({
  args: { schemaId: v.id("schemas") },
  returns: v.array(
    v.object({
      path: v.string(),
      kind: v.union(v.literal("added"), v.literal("removed"), v.literal("changed")),
      before: v.optional(v.any()),
      after: v.optional(v.any()),
    }),
  ),
  handler: async (ctx, args) => {
    const schema = await ctx.db.get(args.schemaId);
    if (!schema) {
      return [];
    }
    const before = { slug: schema.slug, name: schema.name, fields: schema.fields };
    const after = {
      slug: schema.slug,
      name: getWorkingName(schema),
      fields: getWorkingFields(schema),
    };
    return diffSchemaVersions(before, after);
  },
});

export const createTable = adminMutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
  },
  returns: builderTableValidator,
  handler: async (ctx, args) => {
    return await createTableInternal(ctx, args);
  },
});

async function createTableInternal(ctx: MutationCtx, args: { name: string; slug?: string }) {
  const roleCtx = ctx as MutationCtx & AuthedRoleCtx;
  const now = Date.now();
  const slug = args.slug ?? args.name.toLowerCase().replace(/\s+/g, "-");
  const activeSlugs = await getActiveSchemaSlugs(ctx);

  const fields: SchemaField[] = [
    { slug: "title", name: "Title", type: "text", required: true, config: {} },
  ];

  const errors = validateSchemaDescriptor(
    { slug, name: args.name, fields, status: "draft" },
    activeSlugs,
  );
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }

  const existing = await ctx.db
    .query("schemas")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing) {
    throw new Error(`Table with slug "${slug}" already exists`);
  }

  const schemaId = await ctx.db.insert("schemas", {
    slug,
    name: args.name,
    fields,
    descriptorVersion: 1,
    version: 1,
    status: "draft",
    createdBy: roleCtx.cmsUser._id,
    updatedBy: roleCtx.cmsUser._id,
    createdAt: now,
    updatedAt: now,
  });

  await writeAuditLog(ctx, {
    action: "schema.create",
    resourceType: "schema",
    resourceId: slug,
    actorId: roleCtx.cmsUser._id,
    metadata: { name: args.name, status: "draft" },
  });

  const schema = await ctx.db.get(schemaId);
  if (!schema) {
    throw new Error("Failed to create table");
  }
  return toBuilderTable(schema);
}

export const renameTable = adminMutation({
  args: {
    schemaId: v.id("schemas"),
    name: v.string(),
    slug: v.optional(v.string()),
  },
  returns: builderTableValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const schema = await getSchemaOrThrow(ctx, args.schemaId);
    const now = Date.now();
    const newSlug = args.slug ?? schema.slug;
    const activeSlugs = await getActiveSchemaSlugs(ctx);

    if (newSlug !== schema.slug) {
      const existing = await ctx.db
        .query("schemas")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .unique();
      if (existing) {
        throw new Error(`Table with slug "${newSlug}" already exists`);
      }
    }

    const workingFields = getWorkingFields(schema);
    const errors = validateSchemaDescriptor(
      { slug: newSlug, name: args.name, fields: workingFields, status: schema.status },
      activeSlugs.filter((s) => s !== schema.slug),
    );
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.message).join("; "));
    }

    if (schema.status === "active") {
      await ctx.db.patch(schema._id, {
        draftName: args.name,
        draftFields: workingFields,
        baseActiveVersion: schema.baseActiveVersion ?? schema.version,
        updatedBy: roleCtx.cmsUser._id,
        updatedAt: now,
        ...(newSlug !== schema.slug ? { slug: newSlug } : {}),
      });
    } else {
      await ctx.db.patch(schema._id, {
        name: args.name,
        slug: newSlug,
        updatedBy: roleCtx.cmsUser._id,
        updatedAt: now,
      });
    }

    const updated = await ctx.db.get(schema._id);
    if (!updated) {
      throw new Error("Schema not found after rename");
    }
    return toBuilderTable(updated);
  },
});

export const deleteTable = adminMutation({
  args: {
    schemaId: v.id("schemas"),
    confirmDestructive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const schema = await getSchemaOrThrow(ctx, args.schemaId);

    if (schema.status === "active") {
      const entries = await countContentEntries(ctx, schema.slug);
      if (entries.length > 0 && !args.confirmDestructive) {
        throw new Error(
          `Cannot delete table "${schema.slug}": ${entries.length} content entries exist. Confirm destructive change.`,
        );
      }
    }

    await ctx.db.delete(schema._id);

    await writeAuditLog(ctx, {
      action: "schema.update",
      resourceType: "schema",
      resourceId: schema.slug,
      actorId: roleCtx.cmsUser._id,
      metadata: { action: "delete_table" },
    });

    return null;
  },
});

export const addField = adminMutation({
  args: {
    schemaId: v.id("schemas"),
    field: schemaFieldValidator,
  },
  returns: builderTableValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const schema = await getSchemaOrThrow(ctx, args.schemaId);
    const now = Date.now();
    const fields = [...getWorkingFields(schema), args.field];

    await patchSchemaFields(ctx, schema, fields, roleCtx.cmsUser._id, now);
    const updated = await ctx.db.get(schema._id);
    if (!updated) {
      throw new Error("Schema not found after add field");
    }
    return toBuilderTable(updated);
  },
});

export const updateField = adminMutation({
  args: {
    schemaId: v.id("schemas"),
    fieldSlug: v.string(),
    field: schemaFieldValidator,
  },
  returns: builderTableValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const schema = await getSchemaOrThrow(ctx, args.schemaId);
    const now = Date.now();
    const fields = getWorkingFields(schema).map((f) =>
      f.slug === args.fieldSlug ? args.field : f,
    );

    if (!getWorkingFields(schema).some((f) => f.slug === args.fieldSlug)) {
      throw new Error(`Field "${args.fieldSlug}" not found`);
    }

    await patchSchemaFields(ctx, schema, fields, roleCtx.cmsUser._id, now);
    const updated = await ctx.db.get(schema._id);
    if (!updated) {
      throw new Error("Schema not found after update field");
    }
    return toBuilderTable(updated);
  },
});

export const deleteField = adminMutation({
  args: {
    schemaId: v.id("schemas"),
    fieldSlug: v.string(),
    confirmDestructive: v.optional(v.boolean()),
  },
  returns: builderTableValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const schema = await getSchemaOrThrow(ctx, args.schemaId);
    const now = Date.now();

    if (schema.status === "active" || schema.status === "archived") {
      const activeField = schema.fields.find((f) => f.slug === args.fieldSlug);
      if (activeField) {
        const entries = await countContentEntries(ctx, schema.slug);
        const affected = countEntriesWithField(entries, args.fieldSlug);
        if (affected > 0 && !args.confirmDestructive) {
          throw new Error(
            `Cannot delete field "${args.fieldSlug}": ${affected} entries use this field. Confirm destructive change.`,
          );
        }
      }
    }

    const fields = getWorkingFields(schema).filter((f) => f.slug !== args.fieldSlug);
    if (fields.length === getWorkingFields(schema).length) {
      throw new Error(`Field "${args.fieldSlug}" not found`);
    }

    await patchSchemaFields(ctx, schema, fields, roleCtx.cmsUser._id, now);
    const updated = await ctx.db.get(schema._id);
    if (!updated) {
      throw new Error("Schema not found after delete field");
    }
    return toBuilderTable(updated);
  },
});

export const reorderFields = adminMutation({
  args: {
    schemaId: v.id("schemas"),
    fieldSlugs: v.array(v.string()),
  },
  returns: builderTableValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const schema = await getSchemaOrThrow(ctx, args.schemaId);
    const now = Date.now();
    const current = getWorkingFields(schema);
    const bySlug = new Map(current.map((f) => [f.slug, f]));

    if (args.fieldSlugs.length !== current.length) {
      throw new Error("fieldSlugs must include all fields");
    }

    const fields = args.fieldSlugs.map((slug) => {
      const field = bySlug.get(slug);
      if (!field) {
        throw new Error(`Unknown field slug: ${slug}`);
      }
      return field;
    });

    await patchSchemaFields(ctx, schema, fields, roleCtx.cmsUser._id, now);
    const updated = await ctx.db.get(schema._id);
    if (!updated) {
      throw new Error("Schema not found after reorder");
    }
    return toBuilderTable(updated);
  },
});

async function patchSchemaFields(
  ctx: MutationCtx,
  schema: Doc<"schemas">,
  fields: SchemaField[],
  updatedBy: Id<"cmsUsers">,
  now: number,
) {
  if (schema.status === "active") {
    await ctx.db.patch(schema._id, {
      draftFields: fields,
      baseActiveVersion: schema.baseActiveVersion ?? schema.version,
      updatedBy,
      updatedAt: now,
    });
  } else {
    await ctx.db.patch(schema._id, {
      fields,
      updatedBy,
      updatedAt: now,
    });
  }
}

export const updateSchemaDraft = adminMutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
  },
  returns: v.object({
    name: v.string(),
    slug: v.string(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const existingDraft = await ctx.db
      .query("schemas")
      .withIndex("by_status", (q) => q.eq("status", "draft"))
      .order("desc")
      .first();

    if (existingDraft) {
      const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
      const now = Date.now();
      const newSlug = args.slug ?? existingDraft.slug;
      await ctx.db.patch(existingDraft._id, {
        name: args.name,
        slug: newSlug,
        updatedBy: roleCtx.cmsUser._id,
        updatedAt: now,
      });
      return { name: args.name, slug: newSlug, updatedAt: now };
    }

    const result = await createTableInternal(ctx, { name: args.name, slug: args.slug });
    return { name: result.name, slug: result.slug, updatedAt: result.updatedAt };
  },
});

export const applySchema = adminMutation({
  args: {
    schemaId: v.id("schemas"),
    confirmDestructive: v.optional(v.boolean()),
    overwriteConflict: v.optional(v.boolean()),
  },
  returns: v.union(
    v.object({ success: v.literal(true), version: v.number() }),
    v.object({
      success: v.literal(false),
      reason: v.union(
        v.literal("validation"),
        v.literal("conflict"),
        v.literal("destructive"),
        v.literal("invalid_state"),
      ),
      errors: v.optional(v.array(schemaValidationErrorValidator)),
      destructiveChanges: v.optional(v.array(destructiveChangeValidator)),
      currentVersion: v.optional(v.number()),
      baseActiveVersion: v.optional(v.number()),
      message: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const schema = await getSchemaOrThrow(ctx, args.schemaId);
    const now = Date.now();
    const activeSlugs = await getActiveSchemaSlugs(ctx);
    const workingFields = getWorkingFields(schema);
    const workingName = getWorkingName(schema);
    const entries = await countContentEntries(ctx, schema.slug);

    const entriesWithFieldCounts = new Map<string, number>();
    for (const field of schema.fields) {
      entriesWithFieldCounts.set(field.slug, countEntriesWithField(entries, field.slug));
    }

    const plan = planSchemaApply(
      {
        slug: schema.slug,
        name: workingName,
        fields: workingFields,
        status: schema.status,
        version: schema.version,
        baseActiveVersion: schema.baseActiveVersion,
        activeFields: schema.status === "active" ? schema.fields : undefined,
        hasDraftOverlay: schema.draftFields !== undefined,
      },
      activeSlugs,
      {
        confirmDestructive: args.confirmDestructive ?? false,
        entryCount: entries.length,
        entriesWithFieldCounts,
        overwriteConflict: args.overwriteConflict ?? false,
      },
    );

    if (!plan.ok) {
      if (plan.reason === "validation") {
        await ctx.db.patch(schema._id, { status: "apply_failed", updatedAt: now });
        return { success: false as const, reason: "validation" as const, errors: plan.errors };
      }
      if (plan.reason === "conflict") {
        return {
          success: false as const,
          reason: "conflict" as const,
          currentVersion: plan.currentVersion,
          baseActiveVersion: plan.baseActiveVersion,
        };
      }
      if (plan.reason === "destructive") {
        return {
          success: false as const,
          reason: "destructive" as const,
          destructiveChanges: plan.changes,
        };
      }
      return {
        success: false as const,
        reason: "invalid_state" as const,
        message: plan.message,
      };
    }

    const newVersion = plan.newVersion;
    const snapshot = {
      slug: schema.slug,
      name: workingName,
      fields: workingFields,
      descriptorVersion: schema.descriptorVersion,
      status: "active" as const,
    };

    await ctx.db.patch(schema._id, {
      name: workingName,
      fields: workingFields,
      draftFields: undefined,
      draftName: undefined,
      baseActiveVersion: undefined,
      status: "active",
      version: newVersion,
      updatedBy: roleCtx.cmsUser._id,
      updatedAt: now,
    });

    await ctx.db.insert("schemaVersions", {
      schemaId: schema._id,
      version: newVersion,
      snapshot,
      changeSummary: `Applied schema v${newVersion}`,
      createdBy: roleCtx.cmsUser._id,
      createdAt: now,
    });

    await writeAuditLog(ctx, {
      action: "schema.apply",
      resourceType: "schema",
      resourceId: schema.slug,
      actorId: roleCtx.cmsUser._id,
      metadata: { version: newVersion },
    });

    return { success: true as const, version: newVersion };
  },
});

export const discardSchemaDraft = adminMutation({
  args: { schemaId: v.id("schemas") },
  returns: builderTableValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const schema = await getSchemaOrThrow(ctx, args.schemaId);
    const now = Date.now();

    if (schema.status === "active" && schema.draftFields) {
      await ctx.db.patch(schema._id, {
        draftFields: undefined,
        draftName: undefined,
        baseActiveVersion: undefined,
        status: "active",
        updatedBy: roleCtx.cmsUser._id,
        updatedAt: now,
      });
    } else if (schema.status === "draft" || schema.status === "apply_failed") {
      const priorVersion = await ctx.db
        .query("schemaVersions")
        .withIndex("by_schema", (q) => q.eq("schemaId", schema._id))
        .order("desc")
        .first();

      if (priorVersion) {
        await ctx.db.patch(schema._id, {
          name: priorVersion.snapshot.name,
          fields: priorVersion.snapshot.fields,
          status: "active",
          updatedBy: roleCtx.cmsUser._id,
          updatedAt: now,
        });
      } else {
        await ctx.db.delete(schema._id);
        throw new Error("Draft discarded and table removed");
      }
    }

    const updated = await ctx.db.get(schema._id);
    if (!updated) {
      throw new Error("Schema not found after discard");
    }
    return toBuilderTable(updated);
  },
});

export const createSchema = adminMutation({
  args: {
    slug: v.string(),
    name: v.string(),
    status: v.optional(schemaStatusValidator),
  },
  returns: v.id("schemas"),
  handler: async (ctx, args) => {
    const result = await createTableInternal(ctx, { name: args.name, slug: args.slug });
    return result._id;
  },
});
