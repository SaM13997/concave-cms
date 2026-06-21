import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { api } from "../../convex/_generated/api";
import type { Permission, Role } from "../../convex/lib/permissions";
import { roleHasPermission } from "../../convex/lib/permissions";

export function useMyRole() {
  const { data: session } = authClient.useSession();
  const ensureProfile = useMutation(api.cmsUsers.ensureProfile);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    if (!session?.session) {
      setProfileReady(false);
      return;
    }

    let cancelled = false;
    void ensureProfile()
      .then(() => {
        if (!cancelled) {
          setProfileReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfileReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.session, ensureProfile]);

  const roleData = useQuery(api.cmsUsers.getMyRole, session?.session && profileReady ? {} : "skip");

  const isLoading = session?.session ? !profileReady || roleData === undefined : false;

  return {
    role: roleData?.role as Role | undefined,
    permissions: roleData?.permissions as Permission[] | undefined,
    isLoading,
    hasPermission: (permission: Permission) =>
      roleData ? roleHasPermission(roleData.role, permission) : false,
  };
}
