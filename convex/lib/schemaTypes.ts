import type { Infer } from "convex/values";
import type { fieldTypeValidator, schemaFieldValidator } from "./systemValidators";

export type SchemaField = Infer<typeof schemaFieldValidator>;
export type FieldType = Infer<typeof fieldTypeValidator>;

export type SchemaStatus = "draft" | "active" | "archived" | "apply_failed";

export type SchemaDescriptorInput = {
  slug: string;
  name: string;
  fields: SchemaField[];
  status: SchemaStatus;
};

export type SchemaValidationError = {
  code: string;
  message: string;
  field?: string;
};

export type DestructiveChange = {
  type: "delete_field" | "delete_table" | "change_field_type" | "remove_required";
  target: string;
  affectedEntryCount: number;
  message: string;
};
