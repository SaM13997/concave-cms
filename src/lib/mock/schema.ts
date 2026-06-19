export type SchemaFieldType =
  | "text"
  | "richtext"
  | "image"
  | "reference"
  | "number"
  | "boolean"
  | "date";

export type SchemaField = {
  id: string;
  slug: string;
  name: string;
  type: SchemaFieldType;
  required: boolean;
  config?: Record<string, unknown>;
};

export type SchemaTable = {
  id: string;
  slug: string;
  name: string;
  description: string;
  fields: SchemaField[];
  updatedAt: number;
};

export type SchemaExport = {
  version: 1;
  exportedAt: string;
  tables: SchemaTable[];
};

export const FIELD_TYPE_LABELS: Record<SchemaFieldType, string> = {
  text: "Text",
  richtext: "Rich Text",
  image: "Image",
  reference: "Reference",
  number: "Number",
  boolean: "Boolean",
  date: "Date",
};

export const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as SchemaFieldType[];

const now = Date.now();

export const mockSchemaTables: SchemaTable[] = [
  {
    id: "blog",
    slug: "blog",
    name: "Blog",
    description: "A blog content type for grouping posts.",
    updatedAt: now - 1000 * 60 * 60 * 24,
    fields: [
      {
        id: "blog-name",
        slug: "name",
        name: "Name",
        type: "text",
        required: true,
      },
      {
        id: "blog-description",
        slug: "description",
        name: "Description",
        type: "richtext",
        required: false,
      },
    ],
  },
  {
    id: "post",
    slug: "post",
    name: "Post",
    description: "Blog posts with rich content and publishing metadata.",
    updatedAt: now - 1000 * 60 * 30,
    fields: [
      {
        id: "post-title",
        slug: "title",
        name: "Title",
        type: "text",
        required: true,
      },
      {
        id: "post-body",
        slug: "body",
        name: "Body",
        type: "richtext",
        required: true,
      },
      {
        id: "post-featured-image",
        slug: "featuredImage",
        name: "Featured Image",
        type: "image",
        required: false,
      },
      {
        id: "post-blog",
        slug: "blog",
        name: "Blog",
        type: "reference",
        required: true,
        config: { referenceTo: "blog" },
      },
      {
        id: "post-view-count",
        slug: "viewCount",
        name: "View Count",
        type: "number",
        required: false,
      },
      {
        id: "post-published",
        slug: "published",
        name: "Published",
        type: "boolean",
        required: false,
      },
      {
        id: "post-published-at",
        slug: "publishedAt",
        name: "Published At",
        type: "date",
        required: false,
      },
    ],
  },
];

export function cloneSchemaTables(tables: SchemaTable[]): SchemaTable[] {
  return structuredClone(tables);
}

export function createFieldId(): string {
  return `field-${crypto.randomUUID().slice(0, 8)}`;
}

export function createTableId(): string {
  return `table-${crypto.randomUUID().slice(0, 8)}`;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type FieldValidationError = {
  fieldId: string;
  message: string;
};

export function validateTableFields(fields: SchemaField[]): FieldValidationError[] {
  const errors: FieldValidationError[] = [];
  const slugCounts = new Map<string, number>();

  for (const field of fields) {
    if (!field.name.trim()) {
      errors.push({ fieldId: field.id, message: "Field name is required." });
    }

    if (!field.slug.trim()) {
      errors.push({ fieldId: field.id, message: "Field slug is required." });
    } else if (!/^[a-z][a-z0-9_]*$/.test(field.slug)) {
      errors.push({
        fieldId: field.id,
        message:
          "Slug must start with a letter and use lowercase letters, numbers, or underscores.",
      });
    }

    slugCounts.set(field.slug, (slugCounts.get(field.slug) ?? 0) + 1);

    if (field.type === "reference" && !field.config?.referenceTo) {
      errors.push({
        fieldId: field.id,
        message: "Reference fields must specify a target table.",
      });
    }
  }

  for (const field of fields) {
    if (field.slug && (slugCounts.get(field.slug) ?? 0) > 1) {
      errors.push({
        fieldId: field.id,
        message: `Duplicate slug "${field.slug}" within this table.`,
      });
    }
  }

  return errors;
}

export function buildSchemaExport(tables: SchemaTable[]): SchemaExport {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

export function downloadSchemaJson(tables: SchemaTable[], filename = "concave-schema.json") {
  const payload = buildSchemaExport(tables);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
