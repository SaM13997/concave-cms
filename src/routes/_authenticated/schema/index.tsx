import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";
import { useState } from "react";
import { SchemaAdminGate } from "@/components/schema/SchemaAdminGate";
import { useSchemaStore } from "@/components/schema/SchemaProvider";
import { TableCard } from "@/components/schema/TableCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadSchemaJson } from "@/lib/mock/schema";

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
  const { tables, addTable } = useSchemaStore();
  const [newTableName, setNewTableName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateTable = () => {
    const table = addTable(newTableName);
    setNewTableName("");
    setShowCreateForm(false);
    navigate({
      to: "/schema/$tableId",
      params: { tableId: table.id },
    });
  };

  const handleExport = () => {
    // BLOCKER(BE-002): Export is client-side only until schema persistence lands.
    downloadSchemaJson(tables);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schema Builder</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Define content types and fields for your CMS. Changes are stored in local state until
            backend schema mutations are available.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export schema
          </Button>
          <Button type="button" onClick={() => setShowCreateForm((open) => !open)}>
            <Plus className="h-4 w-4" />
            Create table
          </Button>
        </div>
      </div>

      {showCreateForm ? (
        <div className="rounded-lg border border-border bg-card p-4" data-blocker="BE-002">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="new-table-name">Table name</Label>
              <Input
                id="new-table-name"
                value={newTableName}
                onChange={(event) => setNewTableName(event.target.value)}
                placeholder="e.g. Author"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreateTable}>
                Create
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {tables.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="text-sm text-muted-foreground">No content types yet.</p>
          <Button type="button" className="mt-4" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4" />
            Create your first table
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tables.map((table) => (
            <TableCard key={table.id} table={table} />
          ))}
        </div>
      )}
    </div>
  );
}
