import { afterEach, describe, expect, it } from "vitest";
import { applyTestEnv, createTestEnv, TEST_ENV_DEFAULTS, TEST_SECRETS } from "./env";

describe("test env fixtures", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("provides deterministic secrets meeting minimum length", () => {
    expect(TEST_SECRETS.BETTER_AUTH_SECRET.length).toBeGreaterThanOrEqual(16);
    expect(TEST_SECRETS.PREVIEW_SECRET.length).toBeGreaterThanOrEqual(16);
    expect(TEST_SECRETS.E2E_TEST_SECRET.length).toBeGreaterThanOrEqual(16);
  });

  it("applyTestEnv sets process.env from defaults", () => {
    applyTestEnv();
    expect(process.env.BETTER_AUTH_SECRET).toBe(TEST_SECRETS.BETTER_AUTH_SECRET);
    expect(process.env.E2E_TEST_SECRET).toBe(TEST_SECRETS.E2E_TEST_SECRET);
    expect(process.env.CONVEX_AGENT_MODE).toBe("anonymous");
  });

  it("createTestEnv returns a copy without mutating process.env", () => {
    delete process.env.BETTER_AUTH_SECRET;
    const env = createTestEnv();
    expect(env).toEqual(TEST_ENV_DEFAULTS);
    expect(env).not.toBe(TEST_ENV_DEFAULTS);
    expect(process.env.BETTER_AUTH_SECRET).toBeUndefined();
  });
});
