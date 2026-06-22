import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, ChevronUp, Download, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { InsufficientPermissions } from "@/components/insufficient-permissions";
import { OnboardingBanner } from "@/components/onboarding/OnboardingWizard";
import { UserButton } from "@/components/User-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyRole } from "@/hooks/use-my-role";
import { toSafeErrorMessage } from "@/lib/safe-error";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type SchemaSearch = {
  table?: string;
  onboarding?: string;
};

export const Route = createFileRoute("/_authenticated/schema")({
  validateSearch: (search: Record<string, unknown>): SchemaSearch => ({
    table: typeof search.table === "string" ? search.table : undefined,
    onboarding: typeof search.onboarding === "string" ? search.onboarding : undefined,
  }),
  component: SchemaBuilderPage,
});

type FieldType =
  | "text"
  | "richtext"
  | "number"
  | "boolean"
  | "image"
  | "reference"
  | "date"
  | "select"
  | "json";

type BuilderField = {
  slug: string;
  name: string;
  type: FieldType;
  required: boolean;
  config: Record<string, unknown>;
};

type ValidationError = {
  code: string;
  message: string;
  field?: string;
};

const FIELD_TYPES: FieldType[] = [
  "text",
  "richtext",
  "number",
  "boolean",
  "image",
  "reference",
  "date",
  "select",
  "json",
];

function SchemaBuilderPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const { hasPermission, isLoading: roleLoading } = useMyRole();
  const canReadSchema = !roleLoading && hasPermission("schema:read");
  const builderState = useQuery(api.schemaBuilder.getBuilderState, canReadSchema ? {} : "skip");
  const createTable = useMutation(api.schemaBuilder.createTable);
  const addField = useMutation(api.schemaBuilder.addField);
  const updateField = useMutation(api.schemaBuilder.updateField);
  const deleteField = useMutation(api.schemaBuilder.deleteField);
  const reorderFields = useMutation(api.schemaBuilder.reorderFields);
  const applySchema = useMutation(api.schemaBuilder.applySchema);
  const discardDraft = useMutation(api.schemaBuilder.discardSchemaDraft);
  const exportData = useQuery(api.schemaBuilder.exportSchemas, canReadSchema ? {} : "skip");

  const [selectedTableId, setSelectedTableId] = useState<Id<"schemas"> | null>(null);
  const [newTableName, setNewTableName] = useState("");
  const [applyProgress, setApplyProgress] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showDestructiveModal, setShowDestructiveModal] = useState(false);
  const [destructiveChanges, setDestructiveChanges] = useState<
    Array<{ message: string; affectedEntryCount: number }>
  >([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tables = builderState?.tables ?? [];
  const activeSlugs = builderState?.activeSlugs ?? [];

  const selectedTable = useMemo(
    () => tables.find((t) => t._id === selectedTableId) ?? tables[0] ?? null,
    [tables, selectedTableId],
  );

  useEffect(() => {
    if (search.table && tables.length > 0) {
      const match = tables.find((table) => table.slug === search.table);
      if (match) {
        setSelectedTableId(match._id);
        return;
      }
    }
    if (!selectedTableId && tables.length > 0) {
      setSelectedTableId(tables[0]._id);
    }
  }, [tables, selectedTableId, search.table]);

  const selectTable = useCallback(
    (tableId: Id<"schemas">, slug: string) => {
      setSelectedTableId(tableId);
      void navigate({
        search: (prev) => ({
          ...prev,
          table: slug,
        }),
      });
    },
    [navigate],
  );

  const validateTable = useQuery(
    api.schemaBuilder.validateSchema,
    selectedTable ? { schemaId: selectedTable._id } : "skip",
  );

  useEffect(() => {
    if (validateTable) {
      setValidationErrors(validateTable);
    }
  }, [validateTable]);

  const handleCreateTable = useCallback(async () => {
    setErrorMessage(null);
    try {
      const result = await createTable({ name: newTableName || "Untitled" });
      selectTable(result._id, result.slug);
      setNewTableName("");
    } catch (err) {
      setErrorMessage(toSafeErrorMessage(err, "Failed to create table"));
    }
  }, [createTable, newTableName, selectTable]);

  const handleAddField = useCallback(async () => {
    if (!selectedTable) return;
    setErrorMessage(null);
    const slug = `field-${selectedTable.fields.length + 1}`;
    try {
      await addField({
        schemaId: selectedTable._id,
        field: { slug, name: "New Field", type: "text", required: false, config: {} },
      });
    } catch (err) {
      setErrorMessage(toSafeErrorMessage(err, "Failed to add field"));
    }
  }, [addField, selectedTable]);

  const handleFieldChange = useCallback(
    async (fieldSlug: string, updates: Partial<BuilderField>) => {
      if (!selectedTable) return;
      const field = selectedTable.fields.find((f) => f.slug === fieldSlug);
      if (!field) return;
      const updated = { ...field, ...updates };
      try {
        await updateField({
          schemaId: selectedTable._id,
          fieldSlug,
          field: updated,
        });
      } catch (err) {
        setErrorMessage(toSafeErrorMessage(err, "Failed to update field"));
      }
    },
    [updateField, selectedTable],
  );

  const handleDeleteField = useCallback(
    async (fieldSlug: string, confirmDestructive = false) => {
      if (!selectedTable) return;
      try {
        await deleteField({
          schemaId: selectedTable._id,
          fieldSlug,
          confirmDestructive,
        });
      } catch (err) {
        const msg = toSafeErrorMessage(err, "Failed to delete field");
        if (msg.includes("Confirm destructive")) {
          setDestructiveChanges([{ message: msg, affectedEntryCount: 0 }]);
          setShowDestructiveModal(true);
        } else {
          setErrorMessage(msg);
        }
      }
    },
    [deleteField, selectedTable],
  );

  const handleMoveField = useCallback(
    async (fieldSlug: string, direction: "up" | "down") => {
      if (!selectedTable) return;
      const slugs = selectedTable.fields.map((f) => f.slug);
      const idx = slugs.indexOf(fieldSlug);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= slugs.length) return;
      [slugs[idx], slugs[swapIdx]] = [slugs[swapIdx], slugs[idx]];
      await reorderFields({ schemaId: selectedTable._id, fieldSlugs: slugs });
    },
    [reorderFields, selectedTable],
  );

  const handleApply = useCallback(
    async (options?: { confirmDestructive?: boolean; overwriteConflict?: boolean }) => {
      if (!selectedTable) return;
      setApplyProgress("Validating schema…");
      setValidationErrors([]);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const result = await applySchema({
          schemaId: selectedTable._id,
          confirmDestructive: options?.confirmDestructive,
          overwriteConflict: options?.overwriteConflict,
        });

        if (result.success) {
          setApplyProgress(null);
          setSuccessMessage("Schema applied. Content types updated.");
          setShowDestructiveModal(false);
          setShowConflictModal(false);
        } else if (result.reason === "validation") {
          setApplyProgress(null);
          setValidationErrors(result.errors ?? []);
        } else if (result.reason === "conflict") {
          setApplyProgress(null);
          setShowConflictModal(true);
        } else if (result.reason === "destructive") {
          setApplyProgress(null);
          setDestructiveChanges(result.destructiveChanges ?? []);
          setShowDestructiveModal(true);
        } else {
          setApplyProgress(null);
          setErrorMessage(result.message ?? "Apply failed");
        }
      } catch (err) {
        setApplyProgress(null);
        setErrorMessage(toSafeErrorMessage(err, "Apply interrupted"));
      }
    },
    [applySchema, selectedTable],
  );

  const handleDiscard = useCallback(async () => {
    if (!selectedTable) return;
    try {
      await discardDraft({ schemaId: selectedTable._id });
      setValidationErrors([]);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(toSafeErrorMessage(err, "Failed to discard draft"));
    }
  }, [discardDraft, selectedTable]);

  const handleExport = useCallback(() => {
    if (!exportData) return;
    const artifact = {
      ...exportData,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [exportData]);

  const errorsForField = useCallback(
    (fieldSlug: string) => validationErrors.filter((e) => e.field === fieldSlug),
    [validationErrors],
  );

  if (roleLoading) {
    return <div data-testid="schema-loading">Loading...</div>;
  }

  if (!hasPermission("schema:read")) {
    return <InsufficientPermissions requiredPermission="schema:read" />;
  }

  const canApply =
    selectedTable &&
    (selectedTable.status === "draft" ||
      selectedTable.status === "apply_failed" ||
      selectedTable.hasUnpublishedChanges) &&
    validationErrors.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Schema Builder</h1>
          <p className="mt-1 text-sm text-muted-foreground">Define content types and fields</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-testid="schema-export-button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            type="button"
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <UserButton />
        </div>
      </header>

      <main data-testid="schema-builder" className="mx-auto mt-8 w-full max-w-5xl flex-1 space-y-6">
        {search.onboarding === "1" && <OnboardingBanner step="schema" />}
        {selectedTable?.hasUnpublishedChanges && (
          <div
            data-testid="schema-unpublished-banner"
            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm"
          >
            You have unpublished schema changes.
          </div>
        )}

        <section className="flex flex-wrap gap-2">
          {tables.map((table) => (
            <Button
              key={table._id}
              data-testid={`schema-table-${table.slug}`}
              variant={selectedTable?._id === table._id ? "default" : "outline"}
              size="sm"
              onClick={() => selectTable(table._id, table.slug)}
              type="button"
            >
              {table.name}
              {table.hasUnpublishedChanges && " *"}
            </Button>
          ))}
          <div className="flex gap-1">
            <Input
              data-testid="schema-new-table-input"
              placeholder="New table name"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="h-9 w-40"
            />
            <Button
              data-testid="schema-create-table-button"
              size="sm"
              onClick={handleCreateTable}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {selectedTable && (
          <section className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium" data-testid="schema-table-name">
                  {selectedTable.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Status: <span data-testid="schema-status-badge">{selectedTable.status}</span>
                  {selectedTable.hasUnpublishedChanges && " (draft changes)"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  data-testid="schema-discard-draft"
                  variant="outline"
                  size="sm"
                  onClick={handleDiscard}
                  type="button"
                >
                  Discard draft
                </Button>
                <Button
                  data-testid="schema-apply-button"
                  size="sm"
                  disabled={!canApply || !!applyProgress}
                  onClick={() => handleApply()}
                  type="button"
                >
                  Apply schema
                </Button>
              </div>
            </div>

            {applyProgress && (
              <div
                data-testid="schema-apply-progress"
                aria-live="polite"
                className="text-sm text-muted-foreground"
              >
                {applyProgress}
              </div>
            )}

            {successMessage && (
              <div data-testid="schema-apply-success" className="text-sm text-emerald-600">
                {successMessage}
              </div>
            )}

            {validationErrors.length > 0 && (
              <ul
                data-testid="schema-validation-errors"
                className="space-y-1 text-sm text-destructive"
              >
                {validationErrors.map((err) => (
                  <li key={`${err.code}-${err.field ?? "global"}`}>
                    {err.field ? `${err.field}: ` : ""}
                    {err.message}
                  </li>
                ))}
              </ul>
            )}

            {errorMessage && (
              <p data-testid="schema-error" className="text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <div className="space-y-2">
              {selectedTable.fields.map((field, index) => (
                <div
                  key={field.slug}
                  data-testid={`schema-field-row-${field.slug}`}
                  className="flex flex-wrap items-center gap-2 rounded border p-2"
                >
                  <Input
                    data-testid={`schema-field-name-${field.slug}`}
                    value={field.name}
                    onChange={(e) => handleFieldChange(field.slug, { name: e.target.value })}
                    placeholder="Field name"
                    className="h-8 w-32"
                  />
                  <Input
                    data-testid={`schema-field-slug-${field.slug}`}
                    value={field.slug}
                    onChange={(e) => handleFieldChange(field.slug, { slug: e.target.value })}
                    placeholder="slug"
                    className="h-8 w-28 font-mono text-xs"
                  />
                  <select
                    data-testid={`schema-field-type-${field.slug}`}
                    value={field.type}
                    onChange={(e) =>
                      handleFieldChange(field.slug, { type: e.target.value as FieldType })
                    }
                    className="h-8 rounded border bg-background px-2 text-sm"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {field.type === "reference" && (
                    <select
                      data-testid={`schema-field-reference-${field.slug}`}
                      value={(field.config.referenceTo as string) ?? ""}
                      onChange={(e) =>
                        handleFieldChange(field.slug, {
                          config: { ...field.config, referenceTo: e.target.value },
                        })
                      }
                      className="h-8 rounded border bg-background px-2 text-sm"
                    >
                      <option value="">Select target…</option>
                      {activeSlugs.map((slug) => (
                        <option key={slug} value={slug}>
                          {slug}
                        </option>
                      ))}
                    </select>
                  )}
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      data-testid={`schema-field-required-${field.slug}`}
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        handleFieldChange(field.slug, { required: e.target.checked })
                      }
                    />
                    Required
                  </label>
                  <div className="flex gap-1">
                    <Button
                      data-testid={`schema-field-up-${field.slug}`}
                      variant="ghost"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => handleMoveField(field.slug, "up")}
                      type="button"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      data-testid={`schema-field-down-${field.slug}`}
                      variant="ghost"
                      size="sm"
                      disabled={index === selectedTable.fields.length - 1}
                      onClick={() => handleMoveField(field.slug, "down")}
                      type="button"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      data-testid={`schema-field-delete-${field.slug}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteField(field.slug)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {errorsForField(field.slug).map((err) => (
                    <p
                      key={err.code}
                      data-testid={`schema-field-error-${field.slug}`}
                      className="w-full text-xs text-destructive"
                    >
                      {err.message}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <Button
              data-testid="schema-add-field-button"
              variant="outline"
              size="sm"
              onClick={handleAddField}
              type="button"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add field
            </Button>
          </section>
        )}

        {tables.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No tables yet. Create a table to start building your schema.
          </p>
        )}
      </main>

      {showConflictModal && (
        <div
          data-testid="schema-conflict-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Schema changed elsewhere</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The active schema was updated while you were editing. Review differences before
              applying.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                data-testid="schema-conflict-overwrite"
                size="sm"
                onClick={() => {
                  setShowConflictModal(false);
                  handleApply({ overwriteConflict: true });
                }}
                type="button"
              >
                Overwrite
              </Button>
              <Button
                data-testid="schema-conflict-cancel"
                variant="outline"
                size="sm"
                onClick={() => setShowConflictModal(false)}
                type="button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDestructiveModal && (
        <div
          data-testid="schema-destructive-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Destructive change</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {destructiveChanges.map((change) => (
                <li key={change.message}>{change.message}</li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <Button
                data-testid="schema-destructive-confirm"
                size="sm"
                onClick={() => handleApply({ confirmDestructive: true })}
                type="button"
              >
                Confirm
              </Button>
              <Button
                data-testid="schema-destructive-cancel"
                variant="outline"
                size="sm"
                onClick={() => setShowDestructiveModal(false)}
                type="button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
