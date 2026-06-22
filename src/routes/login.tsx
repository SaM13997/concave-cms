import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod/v4";
import { LoginForm } from "@/components/login-form";
import { getPostLoginPath } from "@/lib/auth-redirect";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
  expired: z.coerce.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.userId) {
      throw redirect({ to: getPostLoginPath(search.redirect) });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { expired, mode } = Route.useSearch();

  return (
    <div className="flex flex-col items-center px-4 justify-center h-screen">
      {expired === "1" && (
        <output
          data-testid="session-expired-message"
          className="mb-4 block text-sm text-muted-foreground"
        >
          Your session expired. Please sign in again.
        </output>
      )}
      <LoginForm initialMode={mode === "signup" ? "signup" : "signin"} />
    </div>
  );
}
