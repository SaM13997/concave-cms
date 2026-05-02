import { z } from "zod/v4";

/**
 * Client-side environment variables (available in browser via Vite).
 * All must be prefixed with VITE_ to be exposed to the client bundle.
 */
const clientEnvSchema = z.object({
  VITE_CONVEX_URL: z.url("VITE_CONVEX_URL must be a valid URL"),
  VITE_CONVEX_SITE_URL: z.url("VITE_CONVEX_SITE_URL must be a valid URL"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validate and return client environment variables.
 * Safe to call in browser or server context.
 */
export function getClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
    VITE_CONVEX_SITE_URL: import.meta.env.VITE_CONVEX_SITE_URL,
  });

  if (!result.success) {
    const formatted = z.prettifyError(result.error);
    throw new Error(`Invalid client environment variables:\n${formatted}`);
  }

  return result.data;
}
