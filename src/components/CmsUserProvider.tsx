import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { api, useMutation, useQuery } from "@/lib/convex/hooks";
import { getDefaultRole, type UserRole } from "@/lib/roles";
import type { Doc } from "../../convex/_generated/dataModel";

type CmsUserContextValue = {
  me: Doc<"cmsUsers"> | null | undefined;
  role: UserRole;
  isLoading: boolean;
};

const CmsUserContext = createContext<CmsUserContextValue | null>(null);

export function CmsUserProvider({ children }: { children: ReactNode }) {
  const bootstrap = useMutation(api.cmsUsers.bootstrapSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void bootstrap({}).finally(() => {
      if (!cancelled) {
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [bootstrap]);

  const me = useQuery(api.cmsUsers.getMe, ready ? {} : "skip");

  const value = useMemo<CmsUserContextValue>(
    () => ({
      me: ready ? me : undefined,
      role: me?.role ?? getDefaultRole(),
      isLoading: !ready || me === undefined,
    }),
    [me, ready],
  );

  return <CmsUserContext.Provider value={value}>{children}</CmsUserContext.Provider>;
}

export function useCmsUserContext() {
  const context = useContext(CmsUserContext);
  if (!context) {
    throw new Error("useCmsUserContext must be used within CmsUserProvider");
  }
  return context;
}

export function useCmsUser() {
  return useCmsUserContext().me;
}

export function useUserRole() {
  return useCmsUserContext().role;
}
