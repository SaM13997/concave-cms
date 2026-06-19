import { z } from "zod";

/**
 * Server-side configuration validated at runtime.
 * Complements client env in src/lib/env.ts (Step 0.2).
 */
const serverConfigSchema = z.object({
  SITE_URL: z.string().url().default("http://localhost:3000"),
  CONVEX_SITE_URL: z.string().url().optional(),
  PREVIEW_TOKEN_SECRET: z
    .string()
    .min(16, "PREVIEW_TOKEN_SECRET must be at least 16 characters")
    .default("dev-preview-secret-change-me"),
  PREVIEW_TOKEN_TTL_MS: z.coerce.number().int().positive().default(86_400_000),
  PRESENCE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(60),
  ADMIN_EMAILS: z.string().optional(),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;

let cachedConfig: ServerConfig | undefined;

export function getServerConfig(): ServerConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const result = serverConfigSchema.safeParse({
    SITE_URL: process.env.SITE_URL,
    CONVEX_SITE_URL: process.env.CONVEX_SITE_URL,
    PREVIEW_TOKEN_SECRET: process.env.PREVIEW_TOKEN_SECRET,
    PREVIEW_TOKEN_TTL_MS: process.env.PREVIEW_TOKEN_TTL_MS,
    PRESENCE_TTL_MS: process.env.PRESENCE_TTL_MS,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  });

  if (!result.success) {
    throw new Error(`Invalid server configuration: ${result.error.message}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function isAdminEmail(email: string): boolean {
  const config = getServerConfig();
  if (!config.ADMIN_EMAILS) {
    return false;
  }
  const admins = config.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}
