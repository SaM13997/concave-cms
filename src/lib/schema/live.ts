import type { Doc, Id } from "../../../convex/_generated/dataModel";

export type SchemaDocument = Doc<"schemas">;
export type SchemaField = SchemaDocument["fields"][number];
export type SchemaFieldType = SchemaField["type"];
export type SchemaStatus = SchemaDocument["status"];

export type SchemaTable = {
  id: string;
  schemaId: Id<"schemas">;
  slug: string;
  name: string;
  description: string;
  fields: SchemaField[];
  updatedAt: number;
  status: SchemaStatus;
  locked: boolean;
  version: number;
};

export type FieldValidationError = {
  fieldId?: string;
  message: string;
  path?: string;
};

export const FIELD_TYPE_LABELS: Record<SchemaFieldType, string> = {
  text: "Text",
  richtext: "Rich Text",
  number: "Number",
  boolean: "Boolean",
  image: "Image",
  reference: "Reference",
  date: "Date",
  select: "Select",
  json: "JSON",
};

export const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as SchemaFieldType[];

export function schemaDocToTable(schema: SchemaDocument): SchemaTable {
  return {
    id: schema.slug,
    schemaId: schema._id,
    slug: schema.slug,
    name: schema.name,
    description: schema.description ?? "",
    fields: schema.fields,
    updatedAt: schema.updatedAt,
    status: schema.status,
    locked: schema.locked,
    version: schema.version,
  };
}

export function createEmptyField(partial?: Partial<SchemaField>): SchemaField {
  return {
    id: createFieldId(),
    slug: "",
    name: "",
    type: "text",
    required: false,
    ...partial,
  };
}

export function createFieldId(): string {
  return `field-${crypto.randomUUID().slice(0, 8)}`;
}

export function slugifyFieldName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export function slugifyTableName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateTableFields(fields: SchemaField[]): FieldValidationError[] {
  const errors: FieldValidationError[] = [];
  const slugCounts = new Map<string, number>();

  for (const field of fields) {
    const name = field.name.trim();
    const slug = field.slug.trim();

    if (!name) {
      errors.push({ fieldId: field.id, message: "Field name is required." });
    }

    if (!slug) {
      errors.push({ fieldId: field.id, message: "Field slug is required." });
    } else if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
      errors.push({
        fieldId: field.id,
        message:
          "Slug must start with a letter and use lowercase letters, numbers, or underscores.",
      });
    }

    slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);

    if (field.type === "reference") {
      const referenceTo = field.config?.referenceTo;
      if (typeof referenceTo !== "string" || !referenceTo.trim()) {
        errors.push({
          fieldId: field.id,
          message: "Reference fields must specify a target table.",
        });
      }
    }

    if (field.type === "select") {
      const options = field.config?.options;
      if (!Array.isArray(options) || options.length === 0) {
        errors.push({
          fieldId: field.id,
          message: "Select fields must define at least one option.",
        });
      }
    }
  }

  for (const field of fields) {
    if (field.slug && (slugCounts.get(field.slug.trim()) ?? 0) > 1) {
      errors.push({
        fieldId: field.id,
        message: `Duplicate slug "${field.slug}" within this table.`,
      });
    }
  }

  return errors;
}

export function downloadSchemaJson(payload: unknown, filename = "concave-schema.json") {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatFieldIssues(
  issues: Array<{ path?: string; message: string; fieldId?: string }>,
): FieldValidationError[] {
  return issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
    fieldId: issue.fieldId,
  }));
}

export function areSchemaFieldsEqual(left: SchemaField[], right: SchemaField[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
