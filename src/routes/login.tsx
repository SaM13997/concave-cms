import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod/v4";
import { LoginForm } from "@/components/login-form";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
  expired: z.union([z.literal("1"), z.literal("true")]).optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => loginSearchSchema.parse(search),
  component: LoginPage,
});

function LoginPage() {
  const { redirect, expired } = Route.useSearch();
  const sessionExpired = expired === "1" || expired === "true";

  return (
    <div className="flex flex-col items-center px-4 justify-center min-h-[calc(100lvh-6rem)]">
      <LoginForm redirect={redirect} sessionExpired={sessionExpired} />
    </div>
  );
}
