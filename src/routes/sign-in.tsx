import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { SignInForm } from "@/components/auth/SignInForm";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session) {
      void navigate({ to: "/" });
    }
  }, [navigate, session]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a one-time code.
          </p>
        </div>
        {isPending ? (
          <p className="text-sm text-muted-foreground">Checking session...</p>
        ) : (
          <SignInForm />
        )}
      </div>
    </main>
  );
}
