import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { BottomNav } from "@/components/BottomNav";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && !session) {
      void navigate({ to: "/sign-in" });
    }
  }, [isPending, session, navigate]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
