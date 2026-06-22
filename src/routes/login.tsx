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
    <div className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-6xl gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,28rem)]">
        <section className="app-panel hidden rounded-[2rem] px-8 py-8 lg:block">
          <p className="app-kicker">Convex-native headless CMS</p>
          <h1 className="mt-5 max-w-xl text-[clamp(3.25rem,6vw,5.4rem)] font-semibold leading-[0.92] text-foreground">
            Concave gives content teams a real-time surface for structured publishing.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            Define schema visually, draft safely, preview confidently, and publish into reactive
            frontends without sync jobs or stale content APIs.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["Schema parity", "Bilingual schema engine"],
              ["Draft safety", "Shadow publish model"],
              ["Fast onboarding", "First blog in under 2 min"],
            ].map(([label, note], index) => (
              <div
                key={label}
                className="app-metric"
                data-tone={index === 0 ? "mint" : index === 1 ? "yellow" : "peach"}
              >
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">{note}</p>
              </div>
            ))}
          </div>
        </section>

        <LoginForm redirect={redirect} sessionExpired={sessionExpired} />
      </div>
    </div>
  );
}
