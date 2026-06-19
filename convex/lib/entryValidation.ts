import { z } from "zod";
import type { SchemaField } from "./schemaDescriptor";

function fieldToZod(field: SchemaField): z.ZodType {
  switch (field.type) {
    case "text":
    case "richtext":
    case "image":
    case "date":
      return field.required ? z.string().min(1) : z.string().optional();
    case "number":
      return field.required ? z.number() : z.number().optional();
    case "boolean":
      return field.required ? z.boolean() : z.boolean().optional();
    case "reference":
      return field.required ? z.string().min(1) : z.string().optional();
    case "select": {
      const options = field.config?.options;
      if (Array.isArray(options) && options.every((o) => typeof o === "string")) {
        const enumSchema = z.enum(options as [string, ...string[]]);
        return field.required ? enumSchema : enumSchema.optional();
      }
      return field.required ? z.string().min(1) : z.string().optional();
    }
    case "json":
      return field.required ? z.unknown() : z.unknown().optional();
    default:
      return z.unknown().optional();
  }
}

export function buildEntryDataSchema(
  fields: SchemaField[],
): z.ZodObject<Record<string, z.ZodType>> {
  const shape: Record<string, z.ZodType> = {};
  for (const field of fields) {
    shape[field.slug] = fieldToZod(field);
  }
  return z.object(shape).strict();
}

export type EntryValidationIssue = {
  path: string;
  message: string;
};

export function validateEntryData(
  fields: SchemaField[],
  data: unknown,
):
  | { success: true; data: Record<string, unknown> }
  | { success: false; issues: EntryValidationIssue[] } {
  const schema = buildEntryDataSchema(fields);
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }
  return { success: true, data: parsed.data };
}

export async function validateReferenceFields(
  fields: SchemaField[],
  data: Record<string, unknown>,
  resolveEntryExists: (contentType: string, entryId: string) => Promise<boolean>,
): Promise<EntryValidationIssue[]> {
  const issues: EntryValidationIssue[] = [];

  for (const field of fields) {
    if (field.type !== "reference") continue;
    const value = data[field.slug];
    if (value === undefined || value === null || value === "") continue;
    if (typeof value !== "string") {
      issues.push({ path: field.slug, message: "Reference must be an entry ID string." });
      continue;
    }
    const referenceTo = field.config?.referenceTo;
    if (typeof referenceTo !== "string") {
      issues.push({ path: field.slug, message: "Reference field is misconfigured." });
      continue;
    }
    const exists = await resolveEntryExists(referenceTo, value);
    if (!exists) {
      issues.push({
        path: field.slug,
        message: `Referenced entry "${value}" does not exist in "${referenceTo}".`,
      });
    }
  }

  return issues;
}

export function validateRichTextValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return value.length <= 500_000;
}

export function validateMediaReference(value: unknown): boolean {
  return typeof value === "string" && value.length > 0 && value.length <= 2048;
}
