import { useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { routePathFromLocation } from "@/lib/route-path";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import { PRESENCE_TTL_MS } from "../../../convex/lib/presenceConstants";

const HEARTBEAT_INTERVAL_MS = Math.floor(PRESENCE_TTL_MS / 2);

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PresenceTracker() {
  const { data: session } = authClient.useSession();
  const pathname = useRouterState({
    select: (state) => routePathFromLocation(state.location),
  });
  const heartbeat = useMutation(api.presence.heartbeat);
  const disconnect = useMutation(api.presence.disconnect);
  const heartbeatRef = useRef(heartbeat);
  heartbeatRef.current = heartbeat;

  useEffect(() => {
    if (!session?.session) {
      return;
    }

    let cancelled = false;

    const sendHeartbeat = () => {
      if (cancelled) return;
      void heartbeatRef.current({ routePath: pathname }).catch(() => {
        // ignore transient auth errors during logout
      });
    };

    sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      void disconnect().catch(() => {
        // ignore during teardown
      });
    };
  }, [pathname, disconnect, session?.session]);

  return null;
}

export function PresenceIndicator({ className }: { className?: string }) {
  const { data: session } = authClient.useSession();
  const pathname = useRouterState({
    select: (state) => routePathFromLocation(state.location),
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(interval);
  }, []);

  const viewers = useQuery(
    api.presence.listPresenceForRoute,
    session?.session
      ? {
          routePath: pathname,
          now,
        }
      : "skip",
  );

  if (!session?.session) {
    return null;
  }

  if (!viewers || viewers.length === 0) {
    return (
      <div
        data-testid="presence-indicator"
        data-presence-count="0"
        className={cn("text-xs text-muted-foreground", className)}
      >
        Only you
      </div>
    );
  }

  return (
    <div
      data-testid="presence-indicator"
      data-presence-count={viewers.length}
      className={cn("flex items-center gap-2", className)}
    >
      <span className="text-xs text-muted-foreground">Also here</span>
      <ul data-testid="presence-viewers" className="flex -space-x-2">
        {viewers.map((viewer: NonNullable<typeof viewers>[number]) => (
          <li key={viewer.userId}>
            <Avatar
              data-testid={`presence-avatar-${viewer.userId}`}
              className="h-7 w-7 border border-background"
              title={viewer.name}
            >
              <AvatarFallback className="bg-violet-600 text-[10px] text-white">
                {initials(viewer.name)}
              </AvatarFallback>
            </Avatar>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function usePresenceRoutePath(): string {
  return useRouterState({
    select: (state) => routePathFromLocation(state.location),
  });
}
