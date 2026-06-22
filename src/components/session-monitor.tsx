import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { shouldProtectRoute } from "@/lib/auth-redirect";

/**
 * Redirects to login when an authenticated session expires on a protected route.
 */
export function SessionMonitor() {
  const router = useRouter();
  const hadSession = useRef(false);
  const { data: sessionData, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (sessionData?.session) {
      hadSession.current = true;
      return;
    }

    if (!hadSession.current) {
      return;
    }

    const pathname = router.state.location.pathname;
    if (!shouldProtectRoute(pathname)) {
      return;
    }

    void router.navigate({
      to: "/login",
      search: {
        redirect: pathname,
        expired: "1",
      },
    });
  }, [sessionData, isPending, router]);

  return null;
}
