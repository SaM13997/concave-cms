import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { writeAuditLog } from "./lib/audit";
import { type AuthedRoleCtx, adminMutation, adminQuery } from "./lib/rbac";
import { assertSchemaInvariants } from "./lib/schemaInvariants";
import {
  schemaDescriptorValidator,
  schemaListItemValidator,
  schemaStatusValidator,
} from "./lib/systemValidators";

async function getActiveSchemaSlugs(ctx: QueryCtx | MutationCtx): Promise<string[]> {
  const activeSchemas = await ctx.db
    .query("schemas")
    .withIndex("by_status", (q) => q.eq("status", "active"))
    .collect();
  return activeSchemas.map((schema) => schema.slug);
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
      query = ctx.db
        .query("schemas")
        .withIndex("by_status", (q) =>
          q.eq("status", args.status as "draft" | "active" | "archived"),
        )
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
      name: schema.name,
      fields: schema.fields,
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
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const now = Date.now();
    const slug = args.slug ?? args.name.toLowerCase().replace(/\s+/g, "-");
    const activeSlugs = await getActiveSchemaSlugs(ctx);

    assertSchemaInvariants(
      {
        slug,
        name: args.name,
        fields: [{ slug: "title", name: "Title", type: "text", required: true, config: {} }],
        status: "draft",
      },
      activeSlugs,
    );

    const existingDraft = await ctx.db
      .query("schemas")
      .withIndex("by_status", (q) => q.eq("status", "draft"))
      .order("desc")
      .first();

    if (existingDraft) {
      await ctx.db.patch(existingDraft._id, {
        name: args.name,
        slug,
        updatedBy: roleCtx.cmsUser._id,
        updatedAt: now,
      });

      return { name: args.name, slug, updatedAt: now };
    }

    await ctx.db.insert("schemas", {
      slug,
      name: args.name,
      fields: [{ slug: "title", name: "Title", type: "text", required: true, config: {} }],
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

    return { name: args.name, slug, updatedAt: now };
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
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const now = Date.now();
    const status = args.status ?? "draft";
    const activeSlugs = await getActiveSchemaSlugs(ctx);

    const fields = [
      { slug: "title", name: "Title", type: "text" as const, required: true, config: {} },
    ];
    assertSchemaInvariants({ slug: args.slug, name: args.name, fields, status }, activeSlugs);

    const existing = await ctx.db
      .query("schemas")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error(`Schema with slug "${args.slug}" already exists`);
    }

    const schemaId = await ctx.db.insert("schemas", {
      slug: args.slug,
      name: args.name,
      fields,
      descriptorVersion: 1,
      version: 1,
      status,
      createdBy: roleCtx.cmsUser._id,
      updatedBy: roleCtx.cmsUser._id,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("schemaVersions", {
      schemaId,
      version: 1,
      snapshot: { slug: args.slug, name: args.name, fields, descriptorVersion: 1, status },
      changeSummary: "Initial version",
      createdBy: roleCtx.cmsUser._id,
      createdAt: now,
    });

    await writeAuditLog(ctx, {
      action: "schema.create",
      resourceType: "schema",
      resourceId: args.slug,
      actorId: roleCtx.cmsUser._id,
    });

    return schemaId;
  },
});
