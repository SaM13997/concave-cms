import { z } from "zod";

export const FIELD_TYPES = [
  "text",
  "richtext",
  "number",
  "boolean",
  "image",
  "reference",
  "date",
  "select",
  "json",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const schemaFieldZod = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Slug must start with a letter and use lowercase, numbers, or underscores",
    ),
  name: z.string().min(1),
  type: z.enum(FIELD_TYPES),
  required: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const schemaDescriptorZod = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/, "Content type slug must be lowercase with hyphens"),
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(schemaFieldZod),
  version: z.number().int().nonnegative(),
  status: z.enum(["draft", "active", "archived"]),
  locked: z.boolean(),
  descriptorVersion: z.number().int().positive().default(1),
});

export type SchemaField = z.infer<typeof schemaFieldZod>;
export type SchemaDescriptor = z.infer<typeof schemaDescriptorZod>;

export type SchemaValidationIssue = {
  path: string;
  message: string;
  fieldId?: string;
};

export function validateSchemaDescriptor(
  input: unknown,
): { success: true; data: SchemaDescriptor } | { success: false; issues: SchemaValidationIssue[] } {
  const parsed = schemaDescriptorZod.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  const issues = validateSchemaFields(parsed.data.fields);
  if (issues.length > 0) {
    return { success: false, issues };
  }

  return { success: true, data: parsed.data };
}

export function validateSchemaFields(fields: SchemaField[]): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];
  const slugCounts = new Map<string, number>();

  for (const field of fields) {
    if (!field.name.trim()) {
      issues.push({
        path: `fields.${field.id}.name`,
        message: "Field name is required.",
        fieldId: field.id,
      });
    }
    slugCounts.set(field.slug, (slugCounts.get(field.slug) ?? 0) + 1);
    if (field.type === "reference") {
      const referenceTo = field.config?.referenceTo;
      if (typeof referenceTo !== "string" || !referenceTo.trim()) {
        issues.push({
          path: `fields.${field.id}.config.referenceTo`,
          message: "Reference fields must specify a target content type.",
          fieldId: field.id,
        });
      }
    }
    if (field.type === "select") {
      const options = field.config?.options;
      if (!Array.isArray(options) || options.length === 0) {
        issues.push({
          path: `fields.${field.id}.config.options`,
          message: "Select fields must define at least one option.",
          fieldId: field.id,
        });
      }
    }
  }

  for (const field of fields) {
    if ((slugCounts.get(field.slug) ?? 0) > 1) {
      issues.push({
        path: `fields.${field.id}.slug`,
        message: `Duplicate slug "${field.slug}" within this content type.`,
        fieldId: field.id,
      });
    }
  }

  return issues;
}

export function slugifyTableName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type SchemaExportArtifact = {
  version: 1;
  exportedAt: string;
  descriptorVersion: number;
  tables: Array<{
    slug: string;
    name: string;
    description?: string;
    fields: SchemaField[];
    status: SchemaDescriptor["status"];
    locked: boolean;
    version: number;
  }>;
};

export function buildSchemaExportArtifact(
  schemas: Array<{
    slug: string;
    name: string;
    description?: string;
    fields: SchemaField[];
    status: SchemaDescriptor["status"];
    locked: boolean;
    version: number;
  }>,
): SchemaExportArtifact {
  const sorted = [...schemas].sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    descriptorVersion: 1,
    tables: sorted.map((schema) => ({
      slug: schema.slug,
      name: schema.name,
      description: schema.description,
      fields: schema.fields,
      status: schema.status,
      locked: schema.locked,
      version: schema.version,
    })),
  };
}
