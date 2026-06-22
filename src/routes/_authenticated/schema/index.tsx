import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Download, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { SchemaAdminGate } from "@/components/schema/SchemaAdminGate";
import { useSchemaStore } from "@/components/schema/SchemaProvider";
import { TableCard } from "@/components/schema/TableCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, useMutation, useQuery } from "@/lib/convex/hooks";
import {
  createEmptyField,
  downloadSchemaJson,
  type SchemaField,
  type SchemaFieldType,
} from "@/lib/schema/live";

export const Route = createFileRoute("/_authenticated/schema/")({
  component: SchemaListPage,
});

function SchemaListPage() {
  return (
    <SchemaAdminGate>
      <SchemaListContent />
    </SchemaAdminGate>
  );
}

function SchemaListContent() {
  const navigate = useNavigate();
  const { tables, isLoading } = useSchemaStore();
  const createTable = useMutation(api.schemas.createTable);
  const replaceFields = useMutation(api.schemas.replaceFields);
  const exportArtifact = useQuery(api.schemas.exportArtifact, {});
  const [newTableName, setNewTableName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(collectionTemplates[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const handleCreateTable = async (template = selectedTemplate) => {
    const name = newTableName.trim() || template.name;
    setStatusMessage(null);
    setIsCreating(true);

    try {
      const created = await createTable({
        name,
        description: template.description,
      });

      if (template.fields.length > 0) {
        const fieldResult = await replaceFields({
          schemaId: created._id,
          expectedVersion: created.version,
          fields: template.fields.map((field) =>
            createEmptyField({
              ...field,
              id: `${template.id}-${field.slug}`,
            }),
          ),
        });

        if (!fieldResult.success) {
          setStatusMessage({
            tone: "error",
            text: "Collection created, but the starter fields need attention before apply.",
          });
          navigate({
            to: "/schema/$tableId",
            params: { tableId: created.slug },
          });
          return;
        }
      }

      setNewTableName("");
      setStatusMessage({
        tone: "success",
        text: `Collection "${name}" is ready for editing.`,
      });
      navigate({
        to: "/schema/$tableId",
        params: { tableId: created.slug },
      });
    } catch (error) {
      setStatusMessage({
        tone: "error",
        text: getErrorMessage(error, "Could not create this collection."),
      });
    } finally {
      setIsCreating(false);
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

    downloadSchemaJson(exportArtifact, "concave-schema-artifact.json");
    setStatusMessage({
      tone: "success",
      text: "Downloaded the live schema artifact from Convex.",
    });
  };

  const fieldCount = tables.reduce((total, table) => total + table.fields.length, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Marketing schema cockpit
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Build collections without waiting on a sprint.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Start from a proven content structure, tune fields, then export the live Convex
                schema artifact for handoff or backup.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={!exportArtifact}
            >
              <Download className="h-4 w-4" />
              Export schema
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Collections" value={String(tables.length)} tone="mint" />
            <Metric label="Fields mapped" value={String(fieldCount)} tone="yellow" />
            <Metric label="Fast path" value="< 2 min" tone="peach" />
          </div>

          {statusMessage ? (
            <StatusNotice className="mt-5" tone={statusMessage.tone}>
              {statusMessage.text}
            </StatusNotice>
          ) : null}
        </section>

        <aside className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">New collection</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a starter, name it, and jump straight to fields.
              </p>
            </div>
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
              quick
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="new-table-name">Collection name</Label>
            <Input
              id="new-table-name"
              value={newTableName}
              onChange={(event) => setNewTableName(event.target.value)}
              disabled={isCreating}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleCreateTable();
                }
              }}
              placeholder={selectedTemplate.name}
            />
          </div>

          <div className="mt-4 grid gap-2">
            {collectionTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplate(template)}
                disabled={isCreating}
                className={`rounded-2xl border px-3 py-3 text-left text-sm transition-colors ${
                  selectedTemplate.id === template.id
                    ? "border-primary bg-secondary text-foreground"
                    : "border-border bg-background/60 text-muted-foreground hover:border-primary/35 hover:text-foreground"
                }`}
              >
                <span className="font-medium text-foreground">{template.name}</span>
                <span className="mt-1 block text-xs">{template.fields.length} starter fields</span>
              </button>
            ))}
          </div>

          <Button
            type="button"
            className="mt-4 w-full"
            onClick={() => void handleCreateTable()}
            disabled={isCreating}
          >
            <Plus className="h-4 w-4" />
            {isCreating ? "Creating..." : "Create and edit fields"}
          </Button>
        </aside>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Collections</h2>
              <p className="text-sm text-muted-foreground">
                Open any collection to tune its fields.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/70 p-10 text-center">
              <p className="text-sm text-muted-foreground">Loading collections...</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/70 p-10 text-center">
              <p className="text-sm text-muted-foreground">No content types yet.</p>
              <Button type="button" className="mt-4" onClick={() => void handleCreateTable()}>
                <Plus className="h-4 w-4" />
                Create first collection
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {tables.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <h2 className="text-base font-semibold tracking-tight">Fast workflow</h2>
          <ol className="mt-4 space-y-3 text-sm">
            {[
              "Choose starter collection",
              "Add only the fields marketing needs",
              "Fix guardrail warnings",
              "Export for developer handoff",
            ].map((item, index) => (
              <li key={item} className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-2xl bg-secondary p-4">
            <p className="text-sm font-medium text-secondary-foreground">Most common next action</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Create a Landing Page collection, then add Image, Rich Text, and Reference fields.
            </p>
            <button
              type="button"
              onClick={() => void handleCreateTable(collectionTemplates[1])}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-foreground"
            >
              Start that flow
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

type CollectionTemplate = {
  id: string;
  name: string;
  description: string;
  fields: Array<Pick<SchemaField, "name" | "slug" | "type" | "required" | "config">>;
};

const collectionTemplates: CollectionTemplate[] = [
  {
    id: "blog-post",
    name: "Blog Post",
    description: "Editorial posts with metadata, imagery, and publish controls.",
    fields: [
      field("Title", "title", "text", true),
      field("Body", "body", "richtext", true),
      field("Featured Image", "featured_image", "image", false),
      field("Published", "published", "boolean", false),
    ],
  },
  {
    id: "landing-page",
    name: "Landing Page",
    description: "Campaign pages with hero content, assets, and conversion copy.",
    fields: [
      field("Headline", "headline", "text", true),
      field("Hero Image", "hero_image", "image", false),
      field("CTA Label", "cta_label", "text", true),
      field("Body Blocks", "body_blocks", "richtext", false),
    ],
  },
  {
    id: "customer-story",
    name: "Customer Story",
    description: "Case studies with customer proof, quotes, and relationships.",
    fields: [
      field("Customer Name", "customer_name", "text", true),
      field("Logo", "logo", "image", false),
      field("Quote", "quote", "richtext", true),
      field("Launch Date", "launch_date", "date", false),
    ],
  },
];

function field(
  name: string,
  slug: string,
  type: SchemaFieldType,
  required: boolean,
): Pick<SchemaField, "name" | "slug" | "type" | "required"> {
  return { name, slug, type, required };
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

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "mint" | "yellow" | "peach";
}) {
  const toneClass =
    tone === "mint" ? "bg-secondary" : tone === "yellow" ? "bg-accent" : "bg-[var(--pastel-peach)]";

  return (
    <div className={`rounded-2xl ${toneClass} px-4 py-3`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
