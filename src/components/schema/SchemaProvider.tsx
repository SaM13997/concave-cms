import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import {
  cloneSchemaTables,
  createFieldId,
  createTableId,
  mockSchemaTables,
  type SchemaField,
  type SchemaTable,
  slugify,
} from "@/lib/mock/schema";

type SchemaContextValue = {
  tables: SchemaTable[];
  getTable: (tableId: string) => SchemaTable | undefined;
  addTable: (name: string) => SchemaTable;
  updateTable: (tableId: string, updater: (table: SchemaTable) => SchemaTable) => void;
  removeTable: (tableId: string) => void;
};

const SchemaContext = createContext<SchemaContextValue | null>(null);

export function SchemaProvider({ children }: { children: ReactNode }) {
  const [tables, setTables] = useState<SchemaTable[]>(() => cloneSchemaTables(mockSchemaTables));

  const value = useMemo<SchemaContextValue>(
    () => ({
      tables,
      getTable: (tableId) => tables.find((table) => table.id === tableId),
      addTable: (name) => {
        const trimmed = name.trim() || "Untitled";
        const slug = slugify(trimmed) || createTableId();
        const newTable: SchemaTable = {
          id: slug,
          slug,
          name: trimmed,
          description: "",
          fields: [],
          updatedAt: Date.now(),
        };

        setTables((current) => [...current, newTable]);
        return newTable;
      },
      updateTable: (tableId, updater) => {
        setTables((current) =>
          current.map((table) => {
            if (table.id !== tableId) {
              return table;
            }

            return {
              ...updater(table),
              updatedAt: Date.now(),
            };
          }),
        );
      },
      removeTable: (tableId) => {
        setTables((current) => current.filter((table) => table.id !== tableId));
      },
    }),
    [tables],
  );

  return <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>;
}

export function useSchemaStore() {
  const context = useContext(SchemaContext);

  if (!context) {
    throw new Error("useSchemaStore must be used within SchemaProvider");
  }

  return context;
}

export function createEmptyField(partial?: Partial<SchemaField>): SchemaField {
  return {
    id: createFieldId(),
    slug: "",
    name: "",
    type: "text",
    required: false,
    ...partial,
  };
}
