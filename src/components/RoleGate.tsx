import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { canManageSchema, getMockRole } from "@/lib/mock/roles";

type RoleGateProps = {
  children: ReactNode;
  fallback?: ReactNode;
  requireAdmin?: boolean;
};

export function RoleGate({ children, fallback, requireAdmin = false }: RoleGateProps) {
  const { data: sessionData } = authClient.useSession();
  const role = getMockRole(sessionData?.user?.email);

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

export function useMockRole() {
  const { data: sessionData } = authClient.useSession();
  return getMockRole(sessionData?.user?.email);
}
