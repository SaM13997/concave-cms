import { defineConfig, devices } from "@playwright/test";

const E2E_TEST_SECRET = process.env.E2E_TEST_SECRET ?? "e2e-test-secret-value-32chars";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "bash scripts/e2e-server.sh",
    url: "http://localhost:3000/login",
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      CONVEX_AGENT_MODE: "anonymous",
      E2E_TEST_SECRET,
      BETTER_AUTH_SECRET: "test-better-auth-secret-value-32c",
      BETTER_AUTH_URL: "http://localhost:3000",
      SITE_URL: "http://localhost:3000",
    },
  },
});
