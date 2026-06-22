import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { SchemaField } from "./schemaTypes";

export async function getActiveSchemaBySlug(
  ctx: QueryCtx | MutationCtx,
  slug: string,
): Promise<Doc<"schemas"> | null> {
  const schema = await ctx.db
    .query("schemas")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();

  if (schema?.status !== "active") {
    return null;
  }

  return schema;
}

export async function listActiveContentTypes(ctx: QueryCtx | MutationCtx) {
  const schemas = await ctx.db
    .query("schemas")
    .withIndex("by_status", (q) => q.eq("status", "active"))
    .collect();

  return schemas.map((schema) => ({
    slug: schema.slug,
    name: schema.name,
    fields: schema.fields as SchemaField[],
  }));
}

export function getSchemaFields(schema: Doc<"schemas">): SchemaField[] {
  return schema.fields;
}
