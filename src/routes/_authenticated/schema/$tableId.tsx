import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  Download,
  Plus,
  Rocket,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FieldTypePicker } from "@/components/schema/FieldTypePicker";
import { SchemaAdminGate } from "@/components/schema/SchemaAdminGate";
import { useSchemaStore } from "@/components/schema/SchemaProvider";
import { getFieldError, SchemaValidationBanner } from "@/components/schema/SchemaValidationBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, useMutation, useQuery } from "@/lib/convex/hooks";
import {
  areSchemaFieldsEqual,
  createEmptyField,
  downloadSchemaJson,
  type FieldValidationError,
  formatFieldIssues,
  type SchemaDocument,
  type SchemaField,
  type SchemaFieldType,
  slugifyFieldName,
  validateTableFields,
} from "@/lib/schema/live";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_authenticated/schema/$tableId")({
  component: SchemaTablePage,
});

type SchemaDraft = {
  schemaId: Id<"schemas">;
  name: string;
  slug: string;
  description: string;
  fields: SchemaField[];
};

function SchemaTablePage() {
  const { tableId } = Route.useParams();

  return (
    <SchemaAdminGate>
      <SchemaTableEditor tableSlug={tableId} />
    </SchemaAdminGate>
  );
}

function SchemaTableEditor({ tableSlug }: { tableSlug: string }) {
  const navigate = useNavigate();
  const { tables } = useSchemaStore();
  const liveTable = useQuery(api.schemas.getBySlug, { slug: tableSlug });
  const exportArtifact = useQuery(api.schemas.exportArtifact, {});
  const renameTable = useMutation(api.schemas.renameTable);
  const updateTable = useMutation(api.schemas.updateTable);
  const replaceFields = useMutation(api.schemas.replaceFields);
  const applyDraft = useMutation(api.schemas.applyDraft);

  const [draft, setDraft] = useState<SchemaDraft | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [submissionErrors, setSubmissionErrors] = useState<FieldValidationError[]>([]);
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<SchemaFieldType>("text");
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!liveTable) {
      return;
    }

    setDraft(createDraft(liveTable));
    setSubmissionErrors([]);
    setShowValidation(false);
  }, [liveTable]);

  const validationErrors = useMemo(() => {
    if (!draft) {
      return [];
    }

    return mergeValidationErrors(validateTableFields(draft.fields), submissionErrors);
  }, [draft, submissionErrors]);

  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !liveTable) {
      return false;
    }

    return (
      draft.name.trim() !== liveTable.name ||
      draft.slug.trim() !== liveTable.slug ||
      draft.description.trim() !== (liveTable.description ?? "").trim() ||
      !areSchemaFieldsEqual(normalizeFields(draft.fields), liveTable.fields)
    );
  }, [draft, liveTable]);

  if (liveTable === null) {
    throw notFound();
  }

  if (liveTable === undefined || !draft) {
    return <SchemaTableLoadingState />;
  }

  const referenceTargets = tables.filter((table) => table.slug !== liveTable.slug);
  const requiredCount = draft.fields.filter((field) => field.required).length;
  const hasReference = draft.fields.some((field) => field.type === "reference");

  const updateDraft = (updater: (current: SchemaDraft) => SchemaDraft) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return updater(current);
    });
    setSubmissionErrors([]);
    setStatusMessage(null);
  };

  const updateField = (fieldId: string, updater: (field: SchemaField) => SchemaField) => {
    updateDraft((current) => ({
      ...current,
      fields: current.fields.map((field) => (field.id === fieldId ? updater(field) : field)),
    }));
  };

  const addField = (partial?: Partial<SchemaField>) => {
    const name = partial?.name ?? (fieldName.trim() || "New Field");
    const slug = partial?.slug ?? slugifyFieldName(name);
    const type = partial?.type ?? fieldType;
    const fallbackReference = referenceTargets[0]?.slug ?? "";

    updateDraft((current) => ({
      ...current,
      fields: [
        ...current.fields,
        createEmptyField({
          name,
          slug,
          type,
          required: partial?.required ?? false,
          config:
            partial?.config ??
            (type === "reference" ? { referenceTo: fallbackReference } : undefined),
        }),
      ],
    }));
    setFieldName("");
  };

  const removeField = (fieldId: string) => {
    updateDraft((current) => ({
      ...current,
      fields: current.fields.filter((field) => field.id !== fieldId),
    }));
  };

  const moveField = (fieldId: string, direction: "up" | "down") => {
    updateDraft((current) => {
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
          ? { referenceTo: referenceTargets[0]?.slug ?? "" }
          : type === "select"
            ? { options: field.config?.options ?? ["option_one"] }
            : undefined,
    }));
  };

  const persistDraft = async (options?: {
    successMessage?: string;
  }): Promise<SchemaDocument | null> => {
    const normalizedFields = normalizeFields(draft.fields);
    const localErrors = validateTableFields(normalizedFields);
    setShowValidation(true);
    setSubmissionErrors([]);

    if (localErrors.length > 0) {
      setStatusMessage({
        tone: "error",
        text: "Fix the schema issues below before saving.",
      });
      return null;
    }

    try {
      let current = liveTable;
      const nextName = draft.name.trim();
      const nextSlug = draft.slug.trim();
      const nextDescription = draft.description.trim();
      const liveDescription = (liveTable.description ?? "").trim();

      if (nextSlug !== liveTable.slug) {
        current = await renameTable({
          schemaId: current._id,
          slug: nextSlug,
          name: nextName,
        });
      } else if (nextName !== liveTable.name) {
        current = await updateTable({
          schemaId: current._id,
          name: nextName,
        });
      }

      if (nextDescription !== liveDescription) {
        current = await updateTable({
          schemaId: current._id,
          description: nextDescription || undefined,
        });
      }

      if (!areSchemaFieldsEqual(normalizedFields, current.fields)) {
        const result = await replaceFields({
          schemaId: current._id,
          expectedVersion: current.version,
          fields: normalizedFields,
        });

        if (!result.success) {
          setSubmissionErrors(formatFieldIssues(result.issues));
          setStatusMessage({
            tone: "error",
            text: "Convex rejected the schema changes. Fix the issues below and try again.",
          });
          return null;
        }

        current = result.schema;
      }

      if (options?.successMessage) {
        setStatusMessage({
          tone: "success",
          text: options.successMessage,
        });
      }

      if (current.slug !== tableSlug) {
        navigate({
          to: "/schema/$tableId",
          params: { tableId: current.slug },
          replace: true,
        });
      }

      return current;
    } catch (error) {
      setStatusMessage({
        tone: "error",
        text: getErrorMessage(error, "Could not save this schema."),
      });
      return null;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await persistDraft({
        successMessage: hasUnsavedChanges
          ? "Schema changes saved to Convex."
          : "Schema is up to date.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApply = async () => {
    setIsApplying(true);

    try {
      const saved = await persistDraft();
      if (!saved) {
        return;
      }

      const result = await applyDraft({
        schemaId: saved._id,
        expectedVersion: saved.version,
      });

      if (!result.success) {
        setSubmissionErrors(formatFieldIssues(result.issues));
        setShowValidation(true);
        setStatusMessage({
          tone: "error",
          text: result.conflict
            ? "This schema changed elsewhere. Refresh and try apply again."
            : "Apply was blocked by schema validation issues.",
        });
        return;
      }

      setStatusMessage({
        tone: "success",
        text: `Schema "${result.schema.name}" is now active.`,
      });

      if (result.schema.slug !== tableSlug) {
        navigate({
          to: "/schema/$tableId",
          params: { tableId: result.schema.slug },
          replace: true,
        });
      }
    } catch (error) {
      setStatusMessage({
        tone: "error",
        text: getErrorMessage(error, "Could not apply this schema."),
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleExport = () => {
    if (!exportArtifact) {
      setStatusMessage({
        tone: "error",
        text: "Schema export is still loading. Try again in a moment.",
      });
      return;
    }

    downloadSchemaJson(exportArtifact, `concave-schema-${liveTable.slug}.json`);
    setStatusMessage({
      tone: "success",
      text: "Downloaded the live schema artifact from Convex.",
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6">
          <Link
            to="/schema"
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to schema
          </Link>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Collection setup
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{draft.name}</h1>
                <Badge variant="outline" className="rounded-full px-3 py-1 capitalize">
                  {liveTable.status}
                </Badge>
                {liveTable.locked ? (
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    Locked
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Slug{" "}
                <code className="rounded-lg bg-muted px-2 py-1 font-mono text-xs">
                  {draft.slug}
                </code>
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Changes save to the live Convex backend. Apply promotes the latest valid draft to
                the active schema.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                disabled={!exportArtifact}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleApply()}
                disabled={isApplying || isSaving || liveTable.locked}
              >
                <Rocket className="h-4 w-4" />
                {isApplying ? "Applying..." : "Apply draft"}
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || isApplying || liveTable.locked}
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>

          {statusMessage ? (
            <StatusNotice className="mt-5" tone={statusMessage.tone}>
              {statusMessage.text}
            </StatusNotice>
          ) : null}
        </section>

        <aside className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <h2 className="text-base font-semibold tracking-tight">Readiness</h2>
          <div className="mt-4 space-y-3">
            <ReadinessItem
              done={draft.fields.length > 0}
              label={`${draft.fields.length} fields added`}
            />
            <ReadinessItem done={requiredCount > 0} label={`${requiredCount} required fields`} />
            <ReadinessItem
              done={!hasReference || referenceTargets.length > 0}
              label="References have targets"
            />
            <ReadinessItem done={validationErrors.length === 0} label="Guardrails clear" />
          </div>
          <div className="mt-5 rounded-2xl bg-accent p-4">
            <p className="text-sm font-medium text-accent-foreground">Fastest next move</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Save once your field order and slugs look right, then apply to mark this collection
              active.
            </p>
          </div>
        </aside>
      </div>

      {showValidation ? <SchemaValidationBanner errors={validationErrors} /> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <Field>
                <FieldLabel htmlFor="table-name">Collection name</FieldLabel>
                <FieldContent>
                  <Input
                    id="table-name"
                    value={draft.name}
                    disabled={liveTable.locked}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="table-slug">Collection slug</FieldLabel>
                <FieldContent>
                  <Input
                    id="table-slug"
                    value={draft.slug}
                    disabled={liveTable.locked}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        slug: event.target.value,
                      }))
                    }
                    className="font-mono"
                  />
                </FieldContent>
              </Field>

              <Field className="lg:col-span-2">
                <FieldLabel htmlFor="table-description">Description</FieldLabel>
                <FieldContent>
                  <textarea
                    id="table-description"
                    value={draft.description}
                    disabled={liveTable.locked}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe how this collection should be used."
                  />
                </FieldContent>
              </Field>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="quick-field-name">Add field</Label>
                <Input
                  id="quick-field-name"
                  value={fieldName}
                  disabled={liveTable.locked}
                  onChange={(event) => setFieldName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      addField();
                    }
                  }}
                  placeholder="e.g. SEO Title"
                />
              </div>
              <div className="w-full space-y-2 lg:w-48">
                <Label htmlFor="quick-field-type">Type</Label>
                <FieldTypePicker
                  id="quick-field-type"
                  value={fieldType}
                  disabled={liveTable.locked}
                  onChange={setFieldType}
                />
              </div>
              <Button type="button" onClick={() => addField()} disabled={liveTable.locked}>
                <Plus className="h-4 w-4" />
                Add field
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {fieldPresets.map((preset) => (
                <button
                  key={`${preset.name}-${preset.type}`}
                  type="button"
                  disabled={liveTable.locked}
                  onClick={() => addField(preset)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Fields</h2>
              <p className="text-sm text-muted-foreground">
                Draft locally, save to Convex, and reorder with keyboard-friendly controls.
              </p>
            </div>
            {hasUnsavedChanges ? (
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                Unsaved changes
              </span>
            ) : null}
          </div>

          {draft.fields.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/70 p-8 text-center">
              <p className="text-sm text-muted-foreground">This collection has no fields yet.</p>
              <Button
                type="button"
                className="mt-4"
                variant="outline"
                disabled={liveTable.locked}
                onClick={() => addField(fieldPresets[0])}
              >
                <Plus className="h-4 w-4" />
                Add title field
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {draft.fields.map((field, index) => (
                <li
                  key={field.id}
                  className="rounded-3xl border border-border bg-card p-4 shadow-xs"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.1fr)_minmax(160px,1fr)_170px_130px]">
                      <Field
                        data-invalid={showValidation && !!getFieldError(validationErrors, field.id)}
                      >
                        <FieldLabel htmlFor={`${field.id}-name`}>Name</FieldLabel>
                        <FieldContent>
                          <Input
                            id={`${field.id}-name`}
                            value={field.name}
                            disabled={liveTable.locked}
                            onChange={(event) =>
                              updateField(field.id, (current) => ({
                                ...current,
                                name: event.target.value,
                                slug: current.slug
                                  ? current.slug
                                  : slugifyFieldName(event.target.value),
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
                            disabled={liveTable.locked}
                            onChange={(event) =>
                              updateField(field.id, (current) => ({
                                ...current,
                                slug: event.target.value,
                              }))
                            }
                            className="font-mono"
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
                            disabled={liveTable.locked}
                            onChange={(type) => handleFieldTypeChange(field.id, type)}
                          />
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor={`${field.id}-required`}>Required</FieldLabel>
                        <FieldContent>
                          <label className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm">
                            <input
                              id={`${field.id}-required`}
                              type="checkbox"
                              disabled={liveTable.locked}
                              checked={field.required}
                              onChange={(event) =>
                                updateField(field.id, (current) => ({
                                  ...current,
                                  required: event.target.checked,
                                }))
                              }
                              className="size-4 rounded border border-input accent-primary"
                            />
                            Required
                          </label>
                        </FieldContent>
                      </Field>

                      {field.type === "reference" ? (
                        <Field
                          className="sm:col-span-2 xl:col-span-4"
                          data-invalid={
                            showValidation && !!getFieldError(validationErrors, field.id)
                          }
                        >
                          <FieldLabel htmlFor={`${field.id}-reference`}>
                            Reference target
                          </FieldLabel>
                          <FieldContent>
                            <select
                              id={`${field.id}-reference`}
                              value={String(field.config?.referenceTo ?? "")}
                              disabled={liveTable.locked}
                              onChange={(event) =>
                                updateField(field.id, (current) => ({
                                  ...current,
                                  config: { ...current.config, referenceTo: event.target.value },
                                }))
                              }
                              className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select table...</option>
                              {referenceTargets.map((table) => (
                                <option key={table.schemaId} value={table.slug}>
                                  {table.name}
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
                        disabled={liveTable.locked || index === 0}
                        onClick={() => moveField(field.id, "up")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Move field down"
                        disabled={liveTable.locked || index === draft.fields.length - 1}
                        onClick={() => moveField(field.id, "down")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Delete field"
                        disabled={liveTable.locked}
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

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
            <h2 className="text-base font-semibold tracking-tight">Field palette</h2>
            <div className="mt-4 grid gap-2">
              {fieldTypeHints.map((hint) => (
                <button
                  key={hint.type}
                  type="button"
                  onClick={() => setFieldType(hint.type)}
                  className="flex items-center justify-between rounded-2xl border border-border bg-background px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={liveTable.locked}
                >
                  <span>
                    <span className="block text-sm font-medium text-foreground">{hint.label}</span>
                    <span className="text-xs text-muted-foreground">{hint.use}</span>
                  </span>
                  <span className="rounded-full bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
                    {hint.type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 text-xs leading-5 text-muted-foreground shadow-xs">
            <Label className="text-xs text-muted-foreground">Live draft status</Label>
            <p className="mt-1">
              Save writes this collection to Convex immediately. Apply runs backend validation and
              marks the schema active when it passes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SchemaTableLoadingState() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-xs">
        <p className="text-sm text-muted-foreground">Loading schema details...</p>
      </div>
    </div>
  );
}

const fieldPresets: Array<Partial<SchemaField> & Pick<SchemaField, "name" | "slug" | "type">> = [
  { name: "Title", slug: "title", type: "text", required: true },
  { name: "Hero Image", slug: "hero_image", type: "image" },
  { name: "Body", slug: "body", type: "richtext", required: true },
  { name: "Published", slug: "published", type: "boolean" },
  { name: "Publish Date", slug: "published_at", type: "date" },
  { name: "Related Collection", slug: "related_collection", type: "reference" },
];

const fieldTypeHints: Array<{ type: SchemaFieldType; label: string; use: string }> = [
  { type: "text", label: "Text", use: "Titles, labels, SEO copy" },
  { type: "richtext", label: "Rich Text", use: "Article body and flexible copy" },
  { type: "image", label: "Image", use: "Hero assets and logos" },
  { type: "reference", label: "Reference", use: "Connect entries to collections" },
  { type: "boolean", label: "Boolean", use: "Publish flags and toggles" },
  { type: "date", label: "Date", use: "Launch and schedule fields" },
  { type: "number", label: "Number", use: "Counts, pricing, and metrics" },
  { type: "select", label: "Select", use: "Controlled option sets" },
  { type: "json", label: "JSON", use: "Structured payloads and advanced configs" },
];

function createDraft(schema: SchemaDocument): SchemaDraft {
  return {
    schemaId: schema._id,
    name: schema.name,
    slug: schema.slug,
    description: schema.description ?? "",
    fields: structuredClone(schema.fields),
  };
}

function normalizeFields(fields: SchemaField[]): SchemaField[] {
  return fields.map((field) => {
    const configEntries =
      field.config &&
      Object.entries(field.config).filter(([, value]) => {
        if (typeof value === "string") {
          return value.trim().length > 0;
        }

        if (Array.isArray(value)) {
          return value.length > 0;
        }

        return value !== undefined && value !== null;
      });

    return {
      ...field,
      name: field.name.trim(),
      slug: field.slug.trim(),
      config:
        configEntries && configEntries.length > 0 ? Object.fromEntries(configEntries) : undefined,
    };
  });
}

function mergeValidationErrors(
  localErrors: FieldValidationError[],
  submissionErrors: FieldValidationError[],
): FieldValidationError[] {
  const seen = new Set<string>();
  const merged: FieldValidationError[] = [];

  for (const error of [...localErrors, ...submissionErrors]) {
    const key = `${error.fieldId ?? ""}:${error.path ?? ""}:${error.message}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(error);
  }

  return merged;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function StatusNotice({
  children,
  tone,
  className,
}: {
  children: string;
  tone: "success" | "error";
  className?: string;
}) {
  return (
    <div
      className={`${className ?? ""} rounded-2xl border px-4 py-3 text-sm ${
        tone === "success"
          ? "border-secondary/40 bg-secondary/35 text-secondary-foreground"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }`}
    >
      {children}
    </div>
  );
}

function ReadinessItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full ${
          done ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        <CheckCircle2 className="size-4" aria-hidden="true" />
      </span>
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
