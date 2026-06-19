import type { ReactNode } from "react";
import { RoleGate } from "@/components/RoleGate";

export function SchemaAdminGate({ children }: { children: ReactNode }) {
  return (
    <RoleGate
      requireAdmin
      fallback={
        <div
          role="alert"
          className="rounded-lg border border-border bg-card p-6 text-center"
          data-blocker="BE-001"
        >
          <h2 className="text-base font-medium text-foreground">Insufficient permissions</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Schema builder access is limited to admin users. Editors can manage content but cannot
            change the schema.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Mock rule: sign in with an <code className="rounded bg-muted px-1">@concave.dev</code>{" "}
            email to preview admin UI.
          </p>
        </div>
      }
    >
      {children}
    </RoleGate>
  );
}
