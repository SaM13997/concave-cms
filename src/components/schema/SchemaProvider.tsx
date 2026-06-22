import { createContext, type ReactNode, useContext, useMemo } from "react";
import { api, useQuery } from "@/lib/convex/hooks";
import { type SchemaTable, schemaDocToTable } from "@/lib/schema/live";

type SchemaContextValue = {
  tables: SchemaTable[];
  isLoading: boolean;
  getTable: (tableId: string) => SchemaTable | undefined;
};

const SchemaContext = createContext<SchemaContextValue | null>(null);

export function SchemaProvider({ children }: { children: ReactNode }) {
  const schemas = useQuery(api.schemas.list, {});

  const value = useMemo<SchemaContextValue>(
    () => ({
      tables: [...(schemas ?? [])]
        .map(schemaDocToTable)
        .sort((left, right) => right.updatedAt - left.updatedAt),
      isLoading: schemas === undefined,
      getTable: (tableId) =>
        schemas
          ?.map(schemaDocToTable)
          .find((table) => table.id === tableId || table.schemaId === tableId),
    }),
    [schemas],
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
