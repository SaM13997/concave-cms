import type { Doc, Id } from "../../../convex/_generated/dataModel";

export type EntryStatus = "published" | "draft" | "published_with_draft";

export type ContentFieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "boolean"
  | "image"
  | "reference"
  | "date"
  | "select"
  | "json";

export type ContentField = {
  id: string;
  name: string;
  label: string;
  type: ContentFieldType;
  required: boolean;
  referenceType?: string;
  options?: string[];
};

export type ContentType = {
  _id: Id<"schemas">;
  slug: string;
  name: string;
  description?: string;
  status: Doc<"schemas">["status"];
  fields: ContentField[];
};

export type ContentFieldErrors = Record<string, string>;

type SerializableDraftData = Record<string, unknown>;

export function mapSchemaToContentType(schema: Doc<"schemas">): ContentType {
  return {
    _id: schema._id,
    slug: schema.slug,
    name: schema.name,
    description: schema.description,
    status: schema.status,
    fields: schema.fields.map((field) => ({
      id: field.id,
      name: field.slug,
      label: field.name,
      type: field.type,
      required: field.required,
      referenceType:
        field.type === "reference" && typeof field.config?.referenceTo === "string"
          ? field.config.referenceTo
          : undefined,
      options:
        field.type === "select" &&
        Array.isArray(field.config?.options) &&
        field.config.options.every((option) => typeof option === "string")
          ? field.config.options
          : undefined,
    })),
  };
}

export function deriveEntryStatus(
  entry: Pick<Doc<"entries">, "hasPublished" | "hasUnpublishedChanges">,
): EntryStatus {
  if (!entry.hasPublished) {
    return "draft";
  }
  if (entry.hasUnpublishedChanges) {
    return "published_with_draft";
  }
  return "published";
}

export function getStatusLabel(status: EntryStatus): string {
  switch (status) {
    case "published":
      return "Published";
    case "draft":
      return "Draft";
    case "published_with_draft":
      return "Unpublished changes";
  }
}

export function getEntryTitle(data: SerializableDraftData | null | undefined): string {
  if (!data) {
    return "Untitled";
  }

  for (const candidate of ["title", "name", "slug"]) {
    const value = data[candidate];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "Untitled";
}

export function formatContentDate(value?: number | string | null): string {
  if (value === undefined || value === null) {
    return "Not yet";
  }

  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function buildDraftValues(
  fields: ContentField[],
  data: SerializableDraftData | null | undefined,
): Record<string, unknown> {
  const values = buildEmptyDraftValues(fields);
  const source = data ?? {};

  for (const field of fields) {
    const raw = source[field.name];
    if (raw === undefined) {
      continue;
    }

    switch (field.type) {
      case "boolean":
        values[field.name] = Boolean(raw);
        break;
      case "number":
        values[field.name] = typeof raw === "number" ? raw : String(raw);
        break;
      case "json":
        values[field.name] = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
        break;
      default:
        values[field.name] = raw;
        break;
    }
  }

  return values;
}

export function buildEmptyDraftValues(fields: ContentField[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => [field.name, getDefaultFieldValue(field)]));
}

export function prepareDraftData(
  fields: ContentField[],
  values: Record<string, unknown>,
): { success: true; data: SerializableDraftData } | { success: false; errors: ContentFieldErrors } {
  const data: SerializableDraftData = {};
  const errors: ContentFieldErrors = {};

  for (const field of fields) {
    const raw = values[field.name];

    switch (field.type) {
      case "number": {
        if (raw === "" || raw === undefined || raw === null) {
          if (field.required) {
            errors[field.name] = "This field is required.";
          }
          break;
        }

        const parsed = typeof raw === "number" ? raw : Number(raw);
        if (Number.isNaN(parsed)) {
          errors[field.name] = "Enter a valid number.";
          break;
        }
        data[field.name] = parsed;
        break;
      }

      case "boolean": {
        data[field.name] = Boolean(raw);
        break;
      }

      case "json": {
        if (raw === "" || raw === undefined || raw === null) {
          if (field.required) {
            errors[field.name] = "This field is required.";
          }
          break;
        }

        if (typeof raw === "string") {
          try {
            data[field.name] = JSON.parse(raw);
          } catch {
            errors[field.name] = "JSON must be valid before saving.";
          }
          break;
        }

        data[field.name] = raw;
        break;
      }

      default: {
        const normalized = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
        if (!normalized) {
          if (field.required) {
            errors[field.name] = "This field is required.";
          }
          break;
        }
        data[field.name] = normalized;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data };
}

export function buildPreviewUrl(previewPath: string): string {
  if (/^https?:\/\//.test(previewPath)) {
    return previewPath;
  }

  if (typeof window === "undefined") {
    return previewPath;
  }

  return new URL(previewPath, window.location.origin).toString();
}

export function mapIssuesToFieldErrors(
  issues: Array<{ path: string; message: string }>,
): ContentFieldErrors {
  return Object.fromEntries(issues.map((issue) => [issue.path, issue.message]));
}

export function describeChangedFields(fields: ContentField[], changedFields: string[]): string[] {
  const labels = new Map(fields.map((field) => [field.name, field.label]));
  return changedFields.map((field) => labels.get(field) ?? field);
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function getHistoryActorLabel(
  actorId: Id<"cmsUsers">,
  currentUserId?: Id<"cmsUsers">,
): string {
  if (currentUserId && actorId === currentUserId) {
    return "You";
  }
  return "Teammate";
}

export function canDiscardLiveDraft(status: EntryStatus): boolean {
  return status === "published_with_draft";
}

function getDefaultFieldValue(field: ContentField): unknown {
  switch (field.type) {
    case "boolean":
      return false;
    default:
      return "";
  }
}
