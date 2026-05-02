import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      void navigate({ to: "/app" });
    }
  }, [session, navigate]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Welcome to Concave
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Convex-native headless CMS</p>
        </div>
        <Button asChild>
          <Link to="/sign-in">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight">Sign in to manage your content</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Concave uses email OTP sign-in for a lightweight admin workflow with no passwords to
            remember.
          </p>
          <Button asChild className="mt-6">
            <Link to="/sign-in">Continue to sign in</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
