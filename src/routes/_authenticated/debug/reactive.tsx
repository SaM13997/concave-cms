import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { InsufficientPermissions } from "@/components/insufficient-permissions";
import { UserButton } from "@/components/User-button";
import { Button } from "@/components/ui/button";
import { useMyRole } from "@/hooks/use-my-role";
import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/debug/reactive")({
  component: ReactiveDebugPage,
});

function ReactiveDebugPage() {
  const { hasPermission, isLoading: roleLoading } = useMyRole();
  const canQuery = !roleLoading && hasPermission("content:read");
  const counter = useQuery(api.debugReactive.getReactiveCounter, canQuery ? {} : "skip");
  const increment = useMutation(api.debugReactive.incrementReactiveCounter);

  if (roleLoading) {
    return <div data-testid="reactive-loading">Loading...</div>;
  }

  if (!hasPermission("content:read")) {
    return <InsufficientPermissions requiredPermission="content:read" />;
  }

  const displayValue = counter === undefined ? "…" : String(counter?.value ?? 0);

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reactive Demo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live subscription counter — updates without refresh
          </p>
        </div>
        <UserButton />
      </header>

      <main
        data-testid="reactive-demo"
        className="mx-auto mt-8 flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4"
      >
        <p
          data-testid="reactive-counter-value"
          className="font-mono text-6xl font-bold tabular-nums"
          aria-live="polite"
        >
          {displayValue}
        </p>
        <Button
          data-testid="reactive-counter-increment"
          type="button"
          onClick={() => increment({})}
          disabled={!hasPermission("content:write")}
        >
          Increment
        </Button>
        <p className="text-xs text-muted-foreground">
          Open this page in two sessions — increment in one, watch the other update live.
        </p>
      </main>
    </div>
  );
}
