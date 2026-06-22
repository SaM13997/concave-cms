import type { ReactNode } from "react";
import { useUserRole } from "@/components/CmsUserProvider";
import { canManageSchema } from "@/lib/roles";

type RoleGateProps = {
  children: ReactNode;
  fallback?: ReactNode;
  requireAdmin?: boolean;
};

export function RoleGate({ children, fallback, requireAdmin = false }: RoleGateProps) {
  const role = useUserRole();

  if (requireAdmin && !canManageSchema(role)) {
    return (
      fallback ?? (
        <output className="text-sm text-muted-foreground">
          Insufficient permissions. Schema changes require an admin role.
        </output>
      )
    );
  }

  return <>{children}</>;
}
