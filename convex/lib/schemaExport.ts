import type { SchemaField } from "./schemaTypes";

export type ExportField = {
  config: Record<string, unknown>;
  name: string;
  required: boolean;
  slug: string;
  type: string;
};

export type ExportSchemaEntry = {
  descriptorVersion: number;
  fields: ExportField[];
  name: string;
  slug: string;
};

export type SchemaExportArtifact = {
  formatVersion: 1;
  exportedAt: string;
  schemas: ExportSchemaEntry[];
};

function sortObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  const sorted = Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
  return sorted as T;
}

function normalizeField(field: SchemaField): ExportField {
  return {
    slug: field.slug,
    name: field.name,
    type: field.type,
    required: field.required,
    config: sortObjectKeys(field.config as Record<string, unknown>),
  };
}

export function exportSchemaArtifact(
  schemas: ReadonlyArray<{
    slug: string;
    name: string;
    fields: SchemaField[];
    descriptorVersion: number;
  }>,
  exportedAt?: string,
): SchemaExportArtifact {
  const sortedSchemas = [...schemas]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((schema) => ({
      slug: schema.slug,
      name: schema.name,
      descriptorVersion: schema.descriptorVersion,
      fields: [...schema.fields].sort((a, b) => a.slug.localeCompare(b.slug)).map(normalizeField),
    }));

  return {
    formatVersion: 1,
    exportedAt: exportedAt ?? new Date(0).toISOString(),
    schemas: sortedSchemas,
  };
}

/** Body used for snapshot comparison — excludes envelope metadata. */
export function exportSchemaArtifactBody(
  schemas: ReadonlyArray<{
    slug: string;
    name: string;
    fields: SchemaField[];
    descriptorVersion: number;
  }>,
): Omit<SchemaExportArtifact, "exportedAt"> & { exportedAt?: never } {
  const artifact = exportSchemaArtifact(schemas);
  const { exportedAt: _exportedAt, ...body } = artifact;
  return body;
}
