import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";

/**
 * Ensures a CMS user profile exists after authentication.
 */
export function RoleBootstrap() {
  const ensureProfile = useMutation(api.cmsUsers.ensureProfile);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) {
      return;
    }
    hasRun.current = true;
    void ensureProfile();
  }, [ensureProfile]);

  return null;
}
