import type { SchemaField } from "./schemaTypes";

export type SchemaDiffEntry = {
  path: string;
  kind: "added" | "removed" | "changed";
  before?: unknown;
  after?: unknown;
};

export function diffSchemaVersions(
  before: { slug: string; name: string; fields: SchemaField[] },
  after: { slug: string; name: string; fields: SchemaField[] },
): SchemaDiffEntry[] {
  const diffs: SchemaDiffEntry[] = [];

  if (before.name !== after.name) {
    diffs.push({
      path: "name",
      kind: "changed",
      before: before.name,
      after: after.name,
    });
  }

  const beforeFields = new Map(before.fields.map((f) => [f.slug, f]));
  const afterFields = new Map(after.fields.map((f) => [f.slug, f]));

  for (const [slug, field] of beforeFields) {
    if (!afterFields.has(slug)) {
      diffs.push({ path: `fields.${slug}`, kind: "removed", before: field });
    }
  }

  for (const [slug, field] of afterFields) {
    if (!beforeFields.has(slug)) {
      diffs.push({ path: `fields.${slug}`, kind: "added", after: field });
    }
  }

  for (const [slug, beforeField] of beforeFields) {
    const afterField = afterFields.get(slug);
    if (!afterField) {
      continue;
    }
    if (JSON.stringify(beforeField) !== JSON.stringify(afterField)) {
      diffs.push({
        path: `fields.${slug}`,
        kind: "changed",
        before: beforeField,
        after: afterField,
      });
    }
  }

  return diffs;
}
