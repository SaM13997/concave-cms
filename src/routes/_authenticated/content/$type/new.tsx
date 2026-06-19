import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { FieldRenderer } from "@/components/content/FieldRenderer";
import { Button } from "@/components/ui/button";
import { getContentType } from "@/lib/mock/content";

export const Route = createFileRoute("/_authenticated/content/$type/new")({
  loader: ({ params }) => {
    const contentType = getContentType(params.type);
    if (!contentType) {
      throw notFound();
    }
    const initialValues = Object.fromEntries(contentType.fields.map((field) => [field.name, ""]));
    return { contentType, initialValues };
  },
  component: CreateEntryPage,
});

function CreateEntryPage() {
  const { contentType, initialValues } = Route.useLoaderData();
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    // BLOCKER(BE-003): Content create mutation requires Phase 4 backend
    const mockId = `new-${Date.now()}`;
    setTimeout(() => {
      setIsSaving(false);
      navigate({
        to: "/content/$type/$entryId",
        params: { type: contentType.slug, entryId: mockId },
      });
    }, 400);
  };

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
          Fields are generated from the mock schema for this content type.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FieldRenderer fields={contentType.fields} values={values} onChange={handleChange} />

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button type="submit" disabled={isSaving} data-blocker="BE-003">
            {isSaving ? "Creating…" : "Create draft"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/content/$type" params={{ type: contentType.slug }}>
              Cancel
            </Link>
          </Button>
          <p className="w-full text-xs text-muted-foreground" data-blocker="BE-003">
            BLOCKER(BE-003): Saving entries requires Convex content CRUD APIs.
          </p>
        </div>
      </form>
    </div>
  );
}
