import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Download } from "lucide-react";
import { useCallback } from "react";
import { InsufficientPermissions } from "@/components/insufficient-permissions";
import { useMyRole } from "@/hooks/use-my-role";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SettingsPage() {
  const { role } = useMyRole();
  const schemaSnapshot = useQuery(api.exports.exportFullSnapshot, role === "admin" ? {} : "skip");
  const contentSnapshot = useQuery(
    api.exports.exportContentSnapshot,
    role === "admin" ? {} : "skip",
  );

  const handleExportFull = useCallback(() => {
    if (!schemaSnapshot) return;
    downloadJson(`concave-snapshot-${Date.now()}.json`, schemaSnapshot);
  }, [schemaSnapshot]);

  const handleExportContent = useCallback(() => {
    if (!contentSnapshot) return;
    downloadJson(`concave-content-${Date.now()}.json`, contentSnapshot);
  }, [contentSnapshot]);

  if (role !== "admin") {
    return <InsufficientPermissions requiredPermission="admin" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Settings & exports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download schema and content snapshots for backup or migration.
        </p>
      </header>

      <section
        data-testid="export-tools"
        className="grid gap-4 rounded-lg border border-border bg-card p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium">Full snapshot</h2>
            <p className="text-xs text-muted-foreground">
              Active schemas plus up to 5,000 content entries.
            </p>
          </div>
          <button
            type="button"
            data-testid="export-full-snapshot-button"
            disabled={!schemaSnapshot}
            onClick={handleExportFull}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export full snapshot
          </button>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium">Content snapshot</h2>
            <p className="text-xs text-muted-foreground">Content entries only.</p>
          </div>
          <button
            type="button"
            data-testid="export-content-snapshot-button"
            disabled={!contentSnapshot}
            onClick={handleExportContent}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export content
          </button>
        </div>
      </section>
    </div>
  );
}
