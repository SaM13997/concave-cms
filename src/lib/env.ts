import { z } from "zod/v4";

/**
 * Client-side environment variables (available in browser via Vite).
 * All must be prefixed with VITE_ to be exposed to the client bundle.
 */
const clientEnvSchema = z.object({
  VITE_CONVEX_URL: z.url("VITE_CONVEX_URL must be a valid URL"),
});

/**
 * Server-side environment variables (only available in SSR / server functions).
 * These are NOT exposed to the client bundle.
 */
const serverEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL must be a valid URL"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validate and return client environment variables.
 * Safe to call in browser or server context.
 */
export function getClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
  });

  if (!result.success) {
    const formatted = z.prettifyError(result.error);
    throw new Error(`Invalid client environment variables:\n${formatted}`);
  }

  return result.data;
}

/**
 * Validate and return server environment variables.
 * Only call from server context (SSR, server functions).
 */
export type AppEnvironment = "development" | "staging" | "production";

/** Client-safe deployment label for env banner. */
export function getAppEnvironment(): AppEnvironment {
  const configured = import.meta.env.VITE_APP_ENV;
  if (configured === "staging" || configured === "production") {
    return configured;
  }

  return import.meta.env.PROD ? "production" : "development";
}

export function shouldShowEnvBanner(): boolean {
  return getAppEnvironment() !== "production";
}

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  });

  if (!result.success) {
    const formatted = z.prettifyError(result.error);
    throw new Error(`Invalid server environment variables:\n${formatted}`);
  }

  return result.data;
}
