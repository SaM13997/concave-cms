import { useMutation } from "convex/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

/**
 * Ensures a CMS user profile exists after authentication before rendering children.
 */
export function RoleBootstrap({ children }: { children: ReactNode }) {
  const ensureProfile = useMutation(api.cmsUsers.ensureProfile);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void ensureProfile()
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ensureProfile]);

  if (!ready) {
    return (
      <div data-testid="role-bootstrap-loading" className="p-6 text-sm text-muted-foreground">
        Loading profile…
      </div>
    );
  }

  return children;
}
