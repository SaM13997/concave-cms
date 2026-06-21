import { useQuery } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { api } from "../../convex/_generated/api";
import type { Permission, Role } from "../../convex/lib/permissions";
import { roleHasPermission } from "../../convex/lib/permissions";

export function useMyRole() {
  const { data: session } = authClient.useSession();
  const roleData = useQuery(api.cmsUsers.getMyRole, session?.session ? {} : "skip");

  return {
    role: roleData?.role as Role | undefined,
    permissions: roleData?.permissions as Permission[] | undefined,
    isLoading: session?.session ? roleData === undefined : false,
    hasPermission: (permission: Permission) =>
      roleData ? roleHasPermission(roleData.role, permission) : false,
  };
}
