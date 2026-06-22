import type { Id } from "../_generated/dataModel";
import type { SchemaField } from "./schemaTypes";

export type ContentValidationError = {
  code: string;
  message: string;
  field?: string;
};

export type RichTextValue = {
  format: "html";
  html: string;
};

export function isRichTextValue(value: unknown): value is RichTextValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "format" in value &&
    (value as RichTextValue).format === "html" &&
    "html" in value &&
    typeof (value as RichTextValue).html === "string"
  );
}

function validateFieldValue(
  field: SchemaField,
  value: unknown,
  options: {
    referenceExists: (entryId: Id<"contentEntries">, targetType: string) => boolean;
    mediaExists: (assetId: Id<"mediaAssets">) => boolean;
  },
): ContentValidationError[] {
  const errors: ContentValidationError[] = [];

  if (value === undefined || value === null || value === "") {
    if (field.required) {
      errors.push({
        code: "FIELD_REQUIRED",
        message: `Field "${field.name}" is required`,
        field: field.slug,
      });
    }
    return errors;
  }

  switch (field.type) {
    case "text":
      if (typeof value !== "string") {
        errors.push({
          code: "INVALID_TYPE",
          message: `Field "${field.slug}" must be a string`,
          field: field.slug,
        });
      }
      break;

    case "richtext":
      if (!isRichTextValue(value)) {
        errors.push({
          code: "INVALID_TYPE",
          message: `Field "${field.slug}" must be a rich text object with format "html"`,
          field: field.slug,
        });
      }
      break;

    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) {
        errors.push({
          code: "INVALID_TYPE",
          message: `Field "${field.slug}" must be a number`,
          field: field.slug,
        });
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        errors.push({
          code: "INVALID_TYPE",
          message: `Field "${field.slug}" must be a boolean`,
          field: field.slug,
        });
      }
      break;

    case "date":
      if (typeof value !== "number" && typeof value !== "string") {
        errors.push({
          code: "INVALID_TYPE",
          message: `Field "${field.slug}" must be a date (timestamp or ISO string)`,
          field: field.slug,
        });
      }
      break;

    case "select": {
      if (typeof value !== "string") {
        errors.push({
          code: "INVALID_TYPE",
          message: `Field "${field.slug}" must be a string`,
          field: field.slug,
        });
        break;
      }
      const optionsList = field.config.options;
      if (Array.isArray(optionsList) && optionsList.length > 0) {
        const validOptions = optionsList.filter((o): o is string => typeof o === "string");
        if (validOptions.length > 0 && !validOptions.includes(value)) {
          errors.push({
            code: "INVALID_OPTION",
            message: `Field "${field.slug}" must be one of: ${validOptions.join(", ")}`,
            field: field.slug,
          });
        }
      }
      break;
    }

    case "json":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push({
          code: "INVALID_TYPE",
          message: `Field "${field.slug}" must be a JSON object`,
          field: field.slug,
        });
      }
      break;

    case "image":
      if (typeof value !== "string") {
        errors.push({
          code: "INVALID_TYPE",
          message: `Field "${field.slug}" must be a media asset ID`,
          field: field.slug,
        });
        break;
      }
      if (!options.mediaExists(value as Id<"mediaAssets">)) {
        errors.push({
          code: "MEDIA_NOT_FOUND",
          message: `Media asset for field "${field.slug}" does not exist`,
          field: field.slug,
        });
      }
      break;

    case "reference": {
      if (typeof value !== "string") {
        errors.push({
          code: "INVALID_TYPE",
          message: `Field "${field.slug}" must be a content entry ID`,
          field: field.slug,
        });
        break;
      }
      const referenceTo = field.config.referenceTo;
      if (typeof referenceTo !== "string" || !referenceTo.trim()) {
        errors.push({
          code: "REFERENCE_TARGET_MISSING",
          message: `Reference field "${field.slug}" has no target schema configured`,
          field: field.slug,
        });
        break;
      }
      if (!options.referenceExists(value as Id<"contentEntries">, referenceTo)) {
        errors.push({
          code: "REFERENCE_NOT_FOUND",
          message: `Referenced entry for field "${field.slug}" does not exist or has wrong content type`,
          field: field.slug,
        });
      }
      break;
    }
  }

  return errors;
}

export function validateEntryData(
  fields: readonly SchemaField[],
  data: Record<string, unknown>,
  options: {
    referenceExists: (entryId: Id<"contentEntries">, targetType: string) => boolean;
    mediaExists: (assetId: Id<"mediaAssets">) => boolean;
  },
): ContentValidationError[] {
  const errors: ContentValidationError[] = [];
  const knownSlugs = new Set(fields.map((f) => f.slug));

  for (const field of fields) {
    errors.push(...validateFieldValue(field, data[field.slug], options));
  }

  for (const key of Object.keys(data)) {
    if (!knownSlugs.has(key)) {
      errors.push({
        code: "UNKNOWN_FIELD",
        message: `Unknown field "${key}" is not defined in the active schema`,
        field: key,
      });
    }
  }

  return errors;
}

export function assertEntryData(
  fields: readonly SchemaField[],
  data: Record<string, unknown>,
  options: {
    referenceExists: (entryId: Id<"contentEntries">, targetType: string) => boolean;
    mediaExists: (assetId: Id<"mediaAssets">) => boolean;
  },
): void {
  const errors = validateEntryData(fields, data, options);
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
}
