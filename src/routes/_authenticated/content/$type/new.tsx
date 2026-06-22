import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { FieldRenderer } from "@/components/content/FieldRenderer";
import { Button } from "@/components/ui/button";
import {
  buildEmptyDraftValues,
  getErrorMessage,
  mapSchemaToContentType,
  prepareDraftData,
} from "@/lib/content/live";
import { api, useMutation, useQueries, useQuery } from "@/lib/convex/hooks";

export const Route = createFileRoute("/_authenticated/content/$type/new")({
  component: CreateEntryPage,
});

function CreateEntryPage() {
  const { type } = Route.useParams();
  const navigate = useNavigate();
  const schema = useQuery(api.schemas.getBySlug, { slug: type });
  const contentType = useMemo(() => (schema ? mapSchemaToContentType(schema) : null), [schema]);
  const createEntry = useMutation(api.entries.create);

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!contentType) {
      return;
    }
    setValues(buildEmptyDraftValues(contentType.fields));
    setFieldErrors({});
    setFormError(null);
  }, [contentType]);

  const referenceRequests = useMemo(() => {
    if (!contentType) {
      return {};
    }

    return Object.fromEntries(
      Array.from(
        new Set(
          contentType.fields
            .map((field) => field.referenceType)
            .filter((referenceType): referenceType is string => Boolean(referenceType)),
        ),
      ).map((referenceType) => [
        referenceType,
        {
          query: api.entries.listByType,
          args: {
            contentType: referenceType,
            paginationOpts: {
              cursor: null,
              numItems: 100,
            },
          },
        },
      ]),
    );
  }, [contentType]);
  const referenceResults = useQueries(referenceRequests);

  const referenceOptions = useMemo(() => {
    if (!contentType) {
      return {};
    }

    return Object.fromEntries(
      contentType.fields
        .filter((field) => field.type === "reference" && field.referenceType)
        .map((field) => {
          if (!field.referenceType) {
            return [field.name, []];
          }

          const result = referenceResults[field.referenceType];
          return [
            field.name,
            result && !(result instanceof Error)
              ? result.page.map((entry: { _id: string; title: string }) => ({
                  id: entry._id,
                  label: entry.title,
                }))
              : [],
          ];
        }),
    );
  }, [contentType, referenceResults]);

  const handleChange = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!contentType || schema?.status !== "active") {
      return;
    }

    const prepared = prepareDraftData(contentType.fields, values);
    if (!prepared.success) {
      setFieldErrors(prepared.errors);
      setFormError("Fix the highlighted fields before creating the draft.");
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const created = await createEntry({
        contentType: contentType.slug,
        data: prepared.data,
      });
      await navigate({
        to: "/content/$type/$entryId",
        params: { type: contentType.slug, entryId: created._id },
      });
    } catch (error) {
      setFormError(getErrorMessage(error, "Could not create the draft."));
    } finally {
      setIsSaving(false);
    }
  };

  if (schema === undefined) {
    return (
      <div className="rounded-lg border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">Loading content type...</p>
      </div>
    );
  }

  if (!schema || !contentType) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-base font-semibold text-foreground">Content type not found.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This route does not match a live schema yet.
        </p>
      </div>
    );
  }

  if (schema.status !== "active") {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-base font-semibold text-foreground">{schema.name} is not active yet.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Apply this schema before creating drafts against the live backend.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <nav className="mb-2 text-xs text-muted-foreground">
          <Link to="/content" className="hover:text-foreground">
            Content
          </Link>
          <span className="mx-1.5">/</span>
          <Link
            to="/content/$type"
            params={{ type: contentType.slug }}
            className="hover:text-foreground"
          >
            {contentType.name}
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">New</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">
          New {contentType.name.replace(/s$/, "")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fields are generated from the live schema for this content type.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FieldRenderer
          fields={contentType.fields}
          values={values}
          errors={fieldErrors}
          referenceOptions={referenceOptions}
          onChange={handleChange}
          disabled={isSaving}
        />

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Creating..." : "Create draft"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/content/$type" params={{ type: contentType.slug }}>
              Cancel
            </Link>
          </Button>
          {formError && <p className="w-full text-sm text-destructive">{formError}</p>}
        </div>
      </form>
    </div>
  );
}
