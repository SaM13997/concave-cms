import { detectDestructiveChanges } from "./schemaDestructive";
import { validateSchemaDescriptor } from "./schemaInvariants";
import type { DestructiveChange, SchemaField, SchemaValidationError } from "./schemaTypes";

export type SchemaApplyInput = {
  slug: string;
  name: string;
  fields: SchemaField[];
  status: "draft" | "active" | "archived" | "apply_failed";
  version: number;
  baseActiveVersion?: number;
  activeFields?: SchemaField[];
  hasDraftOverlay?: boolean;
};

export type ApplySchemaResult =
  | { ok: true; newVersion: number }
  | { ok: false; reason: "validation"; errors: SchemaValidationError[] }
  | { ok: false; reason: "conflict"; currentVersion: number; baseActiveVersion: number }
  | { ok: false; reason: "destructive"; changes: DestructiveChange[] }
  | { ok: false; reason: "invalid_state"; message: string };

const VALID_FIELD_TYPES = new Set([
  "text",
  "richtext",
  "number",
  "boolean",
  "image",
  "reference",
  "date",
  "select",
  "json",
]);

export function validateFieldTypes(fields: SchemaField[]): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];
  for (const field of fields) {
    if (!VALID_FIELD_TYPES.has(field.type)) {
      errors.push({
        code: "INVALID_TYPE",
        message: `Field "${field.slug}" has invalid type "${field.type}"`,
        field: field.slug,
      });
    }
    if (!field.name.trim()) {
      errors.push({
        code: "FIELD_REQUIRED",
        message: `Field name is required for "${field.slug}"`,
        field: field.slug,
      });
    }
  }
  return errors;
}

export function planSchemaApply(
  schema: SchemaApplyInput,
  activeSlugs: readonly string[],
  options: {
    confirmDestructive: boolean;
    entryCount: number;
    entriesWithFieldCounts: ReadonlyMap<string, number>;
    overwriteConflict: boolean;
  },
): ApplySchemaResult {
  if (
    schema.status !== "draft" &&
    schema.status !== "apply_failed" &&
    !(schema.status === "active" && schema.hasDraftOverlay)
  ) {
    return {
      ok: false,
      reason: "invalid_state",
      message: "No unpublished schema changes to apply",
    };
  }

  const descriptorErrors = validateSchemaDescriptor(
    { slug: schema.slug, name: schema.name, fields: schema.fields, status: "active" },
    activeSlugs.filter((s) => s !== schema.slug),
  );
  const typeErrors = validateFieldTypes(schema.fields);
  const errors = [...descriptorErrors, ...typeErrors];
  if (errors.length > 0) {
    return { ok: false, reason: "validation", errors };
  }

  if (
    schema.baseActiveVersion !== undefined &&
    schema.baseActiveVersion !== schema.version &&
    !options.overwriteConflict
  ) {
    return {
      ok: false,
      reason: "conflict",
      currentVersion: schema.version,
      baseActiveVersion: schema.baseActiveVersion,
    };
  }

  if (schema.activeFields && schema.activeFields.length > 0) {
    const destructive = detectDestructiveChanges(
      schema.activeFields,
      schema.fields,
      schema.slug,
      options.entryCount,
      options.entriesWithFieldCounts,
    );
    if (destructive.length > 0 && !options.confirmDestructive) {
      return { ok: false, reason: "destructive", changes: destructive };
    }
  }

  const newVersion =
    schema.baseActiveVersion !== undefined ? schema.version + 1 : Math.max(schema.version, 1);

  return { ok: true, newVersion };
}
