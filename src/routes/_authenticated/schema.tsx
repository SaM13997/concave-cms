import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { InsufficientPermissions } from "@/components/insufficient-permissions";
import { UserButton } from "@/components/User-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyRole } from "@/hooks/use-my-role";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/schema")({
  component: SchemaBuilderPage,
});

function SchemaBuilderPage() {
  const { hasPermission, isLoading: roleLoading } = useMyRole();
  const schemaDraft = useQuery(api.schemaBuilder.getSchemaDraft);
  const updateDraft = useMutation(api.schemaBuilder.updateSchemaDraft);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (roleLoading) {
    return <div data-testid="schema-loading">Loading...</div>;
  }

  if (!hasPermission("schema:read")) {
    return <InsufficientPermissions requiredPermission="schema:read" />;
  }

  const handleSave = async () => {
    setError(null);
    try {
      await updateDraft({ name: name || "Untitled schema" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save schema");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Schema Builder</h1>
          <p className="mt-1 text-sm text-muted-foreground">Define content types and fields</p>
        </div>
        <UserButton />
      </header>

      <main data-testid="schema-builder" className="mx-auto mt-8 w-full max-w-3xl flex-1 space-y-4">
        <p className="text-sm text-muted-foreground">
          {schemaDraft === undefined
            ? "Loading draft..."
            : schemaDraft
              ? `Current draft: ${schemaDraft.name}`
              : "No schema draft yet"}
        </p>
        <div className="flex gap-2">
          <Input
            data-testid="schema-name-input"
            placeholder="Schema name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button data-testid="schema-save-button" onClick={handleSave} type="button">
            Save draft
          </Button>
        </div>
        {error && (
          <p data-testid="schema-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
