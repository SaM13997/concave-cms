import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { InsufficientPermissions } from "@/components/insufficient-permissions";
import { UserButton } from "@/components/User-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyRole } from "@/hooks/use-my-role";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/content")({
  component: ContentPage,
});

function ContentPage() {
  const { hasPermission, isLoading: roleLoading } = useMyRole();
  const entries = useQuery(api.content.listContentEntries);
  const createEntry = useMutation(api.content.createContentEntry);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (roleLoading) {
    return <div data-testid="content-loading">Loading...</div>;
  }

  if (!hasPermission("content:read")) {
    return <InsufficientPermissions requiredPermission="content:read" />;
  }

  const handleCreate = async () => {
    setError(null);
    try {
      await createEntry({ title: title || "Untitled entry" });
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Content</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage content entries</p>
        </div>
        <UserButton />
      </header>

      <main data-testid="content-editor" className="mx-auto mt-8 w-full max-w-3xl flex-1 space-y-4">
        <ul data-testid="content-entries-list" className="space-y-2">
          {entries === undefined ? (
            <li className="text-sm text-muted-foreground">Loading entries...</li>
          ) : entries.length === 0 ? (
            <li className="text-sm text-muted-foreground">No entries yet</li>
          ) : (
            entries.map((entry) => (
              <li key={entry.title} className="rounded-md border border-border px-3 py-2 text-sm">
                {entry.title}
              </li>
            ))
          )}
        </ul>
        <div className="flex gap-2">
          <Input
            data-testid="content-title-input"
            placeholder="Entry title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Button data-testid="content-create-button" onClick={handleCreate} type="button">
            Create
          </Button>
        </div>
        {error && (
          <p data-testid="content-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
