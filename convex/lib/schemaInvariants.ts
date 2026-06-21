import type { SchemaDescriptorInput, SchemaValidationError } from "./schemaTypes";

export type { SchemaDescriptorInput, SchemaValidationError };

const SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;

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

export function validateSchemaDescriptor(
  descriptor: SchemaDescriptorInput,
  activeSlugs: readonly string[] = [],
): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];

  if (!descriptor.slug.trim()) {
    errors.push({ code: "FIELD_REQUIRED", message: "Schema slug is required", field: "slug" });
  } else if (!SLUG_PATTERN.test(descriptor.slug)) {
    errors.push({
      code: "DUPLICATE_SLUG",
      message: "Schema slug must match ^[a-z][a-z0-9-]*$",
      field: "slug",
    });
  }

  if (!descriptor.name.trim()) {
    errors.push({ code: "FIELD_REQUIRED", message: "Schema name is required", field: "name" });
  }

  if (descriptor.fields.length === 0 && descriptor.status === "active") {
    errors.push({
      code: "FIELD_REQUIRED",
      message: "Active schemas must have at least one field",
      field: "fields",
    });
  }

  const fieldSlugs = new Set<string>();
  for (const field of descriptor.fields) {
    if (!field.slug.trim()) {
      errors.push({
        code: "FIELD_REQUIRED",
        message: "Field slug is required",
        field: "fields",
      });
      continue;
    }

    if (!SLUG_PATTERN.test(field.slug)) {
      errors.push({
        code: "DUPLICATE_SLUG",
        message: `Field slug "${field.slug}" must match ^[a-z][a-z0-9-]*$`,
        field: field.slug,
      });
    }

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

    if (fieldSlugs.has(field.slug)) {
      errors.push({
        code: "DUPLICATE_SLUG",
        message: `Duplicate field slug: ${field.slug}`,
        field: field.slug,
      });
    } else {
      fieldSlugs.add(field.slug);
    }

    if (field.type === "reference") {
      const referenceTo = field.config.referenceTo;
      if (typeof referenceTo !== "string" || !referenceTo.trim()) {
        errors.push({
          code: "REFERENCE_TARGET_MISSING",
          message: `Reference field "${field.slug}" requires config.referenceTo`,
          field: field.slug,
        });
      } else if (activeSlugs.length > 0 && !activeSlugs.includes(referenceTo)) {
        errors.push({
          code: "REFERENCE_TARGET_MISSING",
          message: `Reference field "${field.slug}" points to unknown schema "${referenceTo}"`,
          field: field.slug,
        });
      }
    }
  }

  return errors;
}

export function assertSchemaInvariants(
  descriptor: SchemaDescriptorInput,
  activeSlugs: readonly string[] = [],
): void {
  const errors = validateSchemaDescriptor(descriptor, activeSlugs);
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join("; "));
  }
}

export function validateReferentialIntegrity(
  referenceSlug: string,
  activeSlugs: readonly string[],
): SchemaValidationError | null {
  if (!activeSlugs.includes(referenceSlug)) {
    return {
      code: "REFERENCE_TARGET_MISSING",
      message: `Reference target "${referenceSlug}" does not exist among active schemas`,
    };
  }
  return null;
}
