import { readFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { api } from "../../convex/_generated/api";
import type { Role } from "../../convex/lib/permissions";

export const E2E_TEST_SECRET = process.env.E2E_TEST_SECRET ?? "e2e-test-secret-value-32chars";
export const CONVEX_URL = process.env.VITE_CONVEX_URL ?? "http://127.0.0.1:3210";

function getConvexUrlFromEnvFile(): string {
  try {
    const env = readFileSync(".env.local", "utf8");
    const match = env.match(/^VITE_CONVEX_URL=(.+)$/m);
    if (match?.[1]) {
      return match[1].trim();
    }
  } catch {
    // fall through
  }
  return CONVEX_URL;
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

export async function waitForAuth(page: Page): Promise<void> {
  await page.waitForFunction(async () => {
    const response = await fetch("/api/auth/convex/token", { credentials: "include" });
    if (!response.ok) {
      return false;
    }
    const data = (await response.json()) as { token?: string };
    return Boolean(data.token);
  });
}

export async function signUp(
  page: Page,
  options?: { email?: string; password?: string; name?: string },
): Promise<{ email: string; password: string }> {
  const email = options?.email ?? uniqueEmail("user");
  const password = options?.password ?? "TestPassword123!";
  const name = options?.name ?? "E2E User";

  await page.goto("/login?mode=signup");
  await page.getByTestId("login-form").waitFor();
  await page.getByTestId("login-name").waitFor();
  await page.waitForLoadState("networkidle");

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-name").fill(name);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL("/", { timeout: 30_000 });
  await waitForAuth(page);

  return { email, password };
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByTestId("login-form").waitFor();
  await page.waitForLoadState("networkidle");

  const heading = await page.getByTestId("login-heading").textContent();
  if (heading?.includes("Create your account")) {
    await page.getByTestId("login-toggle-mode").click();
  }

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL("/", { timeout: 30_000 });
}

export async function signOut(page: Page): Promise<void> {
  const cookies = await page.context().cookies();
  const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  await page.request.post("/api/auth/sign-out", {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
  await page.goto("/login");
  await page.waitForURL("/login");
}

export async function assignRole(page: Page, role: Role): Promise<void> {
  const token = await getConvexAuthToken(page);
  const client = new ConvexHttpClient(getConvexUrlFromEnvFile());
  client.setAuth(token);
  await client.mutation(api.cmsUsers.assignRoleForE2e, {
    role,
    secret: E2E_TEST_SECRET,
  });
}

export async function disconnectPresence(page: Page): Promise<void> {
  const token = await getConvexAuthToken(page);
  const client = new ConvexHttpClient(getConvexUrlFromEnvFile());
  client.setAuth(token);
  await client.mutation(api.presence.disconnect, {});
}

export async function createTestMediaAsset(
  page: Page,
  filename: string,
): Promise<void> {
  const token = await getConvexAuthToken(page);
  const client = new ConvexHttpClient(getConvexUrlFromEnvFile());
  client.setAuth(token);

  const uploadUrl = await client.mutation(api.media.generateUploadUrl, {});
  const tinyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: tinyPng,
  });
  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload test media asset: ${uploadResponse.status}`);
  }

  const { storageId } = (await uploadResponse.json()) as { storageId: string };
  await client.mutation(api.media.createMediaAsset, {
    storageId,
    filename,
    mimeType: "image/png",
    sizeBytes: tinyPng.length,
  });
}

async function getConvexAuthToken(page: Page): Promise<string> {
  const token = await page.evaluate(async () => {
    const response = await fetch("/api/auth/convex/token", { credentials: "include" });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { token?: string };
    return data.token ?? null;
  });

  if (!token) {
    throw new Error("Could not obtain Convex auth token for role assignment");
  }

  return token;
}

export async function waitForActiveContentType(page: Page, slug: string): Promise<void> {
  await page.getByTestId("nav-content").click();
  await page.waitForURL("/content**");
  const typeButton = page.getByTestId(`content-type-${slug}`);
  await expect(typeButton).toBeAttached({ timeout: 60_000 });
  await typeButton.scrollIntoViewIfNeeded();
}

export { uniqueEmail };
