/**
 * Deterministic environment values for unit/integration tests.
 * Tests should import these instead of reading real secrets from the environment.
 */
export const TEST_SECRETS = {
  BETTER_AUTH_SECRET: "test-better-auth-secret-value-32c",
  PREVIEW_SECRET: "test-preview-secret-value-32chars",
} as const;

export const TEST_ENV_DEFAULTS = {
  VITE_CONVEX_URL: "http://127.0.0.1:3210",
  BETTER_AUTH_SECRET: TEST_SECRETS.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: "http://localhost:3000",
  SITE_URL: "http://localhost:3000",
  CONVEX_AGENT_MODE: "anonymous",
} as const;

export type TestEnvDefaults = typeof TEST_ENV_DEFAULTS;

export function applyTestEnv(overrides?: Partial<TestEnvDefaults>): TestEnvDefaults {
  const env = { ...TEST_ENV_DEFAULTS, ...overrides };
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
  return env;
}

export function createTestEnv(overrides?: Partial<TestEnvDefaults>): TestEnvDefaults {
  return { ...TEST_ENV_DEFAULTS, ...overrides };
}
