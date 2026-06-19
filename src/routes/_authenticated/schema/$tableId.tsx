import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { FieldTypePicker } from "@/components/schema/FieldTypePicker";
import { SchemaAdminGate } from "@/components/schema/SchemaAdminGate";
import { createEmptyField, useSchemaStore } from "@/components/schema/SchemaProvider";
import { getFieldError, SchemaValidationBanner } from "@/components/schema/SchemaValidationBanner";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type SchemaField,
  type SchemaFieldType,
  slugify,
  validateTableFields,
} from "@/lib/mock/schema";

export const Route = createFileRoute("/_authenticated/schema/$tableId")({
  component: SchemaTablePage,
});

function SchemaTablePage() {
  const { tableId } = Route.useParams();

  return (
    <SchemaAdminGate>
      <SchemaTableEditor tableId={tableId} />
    </SchemaAdminGate>
  );
}

function SchemaTableEditor({ tableId }: { tableId: string }) {
  const { getTable, updateTable, tables } = useSchemaStore();
  const table = getTable(tableId);
  const [showValidation, setShowValidation] = useState(false);

  if (!table) {
    throw notFound();
  }

  const validationErrors = useMemo(() => validateTableFields(table.fields), [table.fields]);

  const updateField = (fieldId: string, updater: (field: SchemaField) => SchemaField) => {
    updateTable(tableId, (current) => ({
      ...current,
      fields: current.fields.map((field) => (field.id === fieldId ? updater(field) : field)),
    }));
  };

  const addField = () => {
    updateTable(tableId, (current) => ({
      ...current,
      fields: [...current.fields, createEmptyField({ name: "New Field", slug: "new_field" })],
    }));
  };

  const removeField = (fieldId: string) => {
    updateTable(tableId, (current) => ({
      ...current,
      fields: current.fields.filter((field) => field.id !== fieldId),
    }));
  };

  const moveField = (fieldId: string, direction: "up" | "down") => {
    updateTable(tableId, (current) => {
      const index = current.fields.findIndex((field) => field.id === fieldId);
      if (index === -1) {
        return current;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.fields.length) {
        return current;
      }

      const nextFields = [...current.fields];
      const [moved] = nextFields.splice(index, 1);
      nextFields.splice(targetIndex, 0, moved);

      return {
        ...current,
        fields: nextFields,
      };
    });
  };

  const handleFieldTypeChange = (fieldId: string, type: SchemaFieldType) => {
    updateField(fieldId, (field) => ({
      ...field,
      type,
      config:
        type === "reference"
          ? { referenceTo: tables.find((item) => item.id !== tableId)?.slug ?? "" }
          : undefined,
    }));
  };

  const handleSave = () => {
    setShowValidation(true);
    if (validationErrors.length > 0) {
      return;
    }

    // BLOCKER(BE-002): Persist schema changes via Convex mutation when backend lands.
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/schema"
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to schema
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{table.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Slug <code className="rounded bg-muted px-1 py-0.5 text-xs">{table.slug}</code>
          </p>
          {table.description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{table.description}</p>
          ) : null}
        </div>
        <Button type="button" onClick={handleSave} data-blocker="BE-002">
          Save changes
        </Button>
      </div>

      {showValidation ? <SchemaValidationBanner errors={validationErrors} /> : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-medium">Fields</h2>
            <p className="text-sm text-muted-foreground">
              Add, edit, and reorder fields for this content type.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addField}>
            <Plus className="h-4 w-4" />
            Add field
          </Button>
        </div>

        {table.fields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">This table has no fields yet.</p>
            <Button type="button" className="mt-4" variant="outline" onClick={addField}>
              <Plus className="h-4 w-4" />
              Add first field
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {table.fields.map((field, index) => (
              <li
                key={field.id}
                className="rounded-lg border border-border bg-card p-4"
                data-blocker="BE-002"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="grid flex-1 gap-4 sm:grid-cols-2">
                    <Field
                      data-invalid={showValidation && !!getFieldError(validationErrors, field.id)}
                    >
                      <FieldLabel htmlFor={`${field.id}-name`}>Name</FieldLabel>
                      <FieldContent>
                        <Input
                          id={`${field.id}-name`}
                          value={field.name}
                          onChange={(event) =>
                            updateField(field.id, (current) => ({
                              ...current,
                              name: event.target.value,
                              slug: current.slug ? current.slug : slugify(event.target.value),
                            }))
                          }
                        />
                      </FieldContent>
                    </Field>

                    <Field
                      data-invalid={showValidation && !!getFieldError(validationErrors, field.id)}
                    >
                      <FieldLabel htmlFor={`${field.id}-slug`}>Slug</FieldLabel>
                      <FieldContent>
                        <Input
                          id={`${field.id}-slug`}
                          value={field.slug}
                          onChange={(event) =>
                            updateField(field.id, (current) => ({
                              ...current,
                              slug: event.target.value,
                            }))
                          }
                        />
                        {showValidation ? (
                          <FieldError>{getFieldError(validationErrors, field.id)}</FieldError>
                        ) : null}
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={`${field.id}-type`}>Type</FieldLabel>
                      <FieldContent>
                        <FieldTypePicker
                          id={`${field.id}-type`}
                          value={field.type}
                          onChange={(type) => handleFieldTypeChange(field.id, type)}
                        />
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={`${field.id}-required`}>Required</FieldLabel>
                      <FieldContent>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            id={`${field.id}-required`}
                            type="checkbox"
                            checked={field.required}
                            onChange={(event) =>
                              updateField(field.id, (current) => ({
                                ...current,
                                required: event.target.checked,
                              }))
                            }
                            className="size-4 rounded border border-input accent-primary"
                          />
                          Required field
                        </label>
                      </FieldContent>
                    </Field>

                    {field.type === "reference" ? (
                      <Field
                        className="sm:col-span-2"
                        data-invalid={showValidation && !!getFieldError(validationErrors, field.id)}
                      >
                        <FieldLabel htmlFor={`${field.id}-reference`}>Reference target</FieldLabel>
                        <FieldContent>
                          <select
                            id={`${field.id}-reference`}
                            value={String(field.config?.referenceTo ?? "")}
                            onChange={(event) =>
                              updateField(field.id, (current) => ({
                                ...current,
                                config: { ...current.config, referenceTo: event.target.value },
                              }))
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          >
                            <option value="">Select table…</option>
                            {tables
                              .filter((item) => item.id !== tableId)
                              .map((item) => (
                                <option key={item.id} value={item.slug}>
                                  {item.name}
                                </option>
                              ))}
                          </select>
                          {showValidation ? (
                            <FieldError>{getFieldError(validationErrors, field.id)}</FieldError>
                          ) : null}
                        </FieldContent>
                      </Field>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-1 self-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Move field up"
                      disabled={index === 0}
                      onClick={() => moveField(field.id, "up")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Move field down"
                      disabled={index === table.fields.length - 1}
                      onClick={() => moveField(field.id, "down")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Delete field"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
        <Label className="text-xs text-muted-foreground">Local draft notice</Label>
        <p className="mt-1">
          Schema edits live in React state seeded from mock data. Reloading the page resets changes
          until BE-002 schema CRUD mutations are wired up.
        </p>
      </div>
    </div>
  );
}
