import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Role } from "../convex/lib/permissions";
import { assignRole, CONVEX_URL, signUp, waitForAuth } from "./helpers/auth";

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

async function getConvexAuthToken(page: import("@playwright/test").Page): Promise<string> {
  const token = await page.evaluate(async () => {
    const response = await fetch("/api/auth/convex/token", { credentials: "include" });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { token?: string };
    return data.token ?? null;
  });

  if (!token) {
    throw new Error("Could not obtain Convex auth token");
  }

  return token;
}

async function waitForRole(page: import("@playwright/test").Page, role: Role): Promise<void> {
  await expect
    .poll(
      async () => {
        const token = await getConvexAuthToken(page);
        const client = new ConvexHttpClient(getConvexUrlFromEnvFile());
        client.setAuth(token);
        const result = await client.query(api.cmsUsers.getMyRole, {});
        return result.role;
      },
      { timeout: 30_000 },
    )
    .toBe(role);
}

async function prepareAdmin(page: import("@playwright/test").Page) {
  await signUp(page);
  await waitForAuth(page);
  await assignRole(page, "admin");
  await waitForRole(page, "admin");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await waitForAuth(page);
  await waitForRole(page, "admin");
  await page.getByTestId("admin-chrome").waitFor({ timeout: 15_000 });
}

async function prepareEditor(page: import("@playwright/test").Page) {
  await signUp(page);
  await waitForAuth(page);
  await page.getByTestId("admin-chrome").waitFor({ timeout: 15_000 });
}

async function openSchemaBuilder(page: import("@playwright/test").Page) {
  await page.getByTestId("nav-schema").waitFor({ timeout: 15_000 });
  await page.getByTestId("nav-schema").click();
  await page.waitForURL("/schema");
}

async function openContentEditor(page: import("@playwright/test").Page) {
  await page.getByTestId("nav-content").waitFor({ timeout: 15_000 });
  await page.getByTestId("nav-content").click();
  await page.waitForURL("/content");
}

test.describe("RBAC", () => {
  test("editor cannot access schema builder", async ({ page }) => {
    await signUp(page);
    await page.getByTestId("nav-home").waitFor({ timeout: 15_000 });
    await page.goto("/schema");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("insufficient-permissions")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("schema-builder")).not.toBeVisible();
  });

  test("admin can access schema builder", async ({ page }) => {
    await prepareAdmin(page);
    await openSchemaBuilder(page);
    await expect(page.getByTestId("schema-builder")).toBeVisible();
    await expect(page.getByTestId("insufficient-permissions")).not.toBeVisible();
  });

  test("editor can access content editor", async ({ page }) => {
    await signUp(page);
    await openContentEditor(page);
    await expect(page.getByTestId("content-editor")).toBeVisible();
  });

  test("schema nav hidden for editor", async ({ page }) => {
    await signUp(page);
    await page.getByTestId("nav-home").waitFor();
    await expect(page.getByTestId("nav-schema")).not.toBeVisible();
    await expect(page.getByTestId("nav-content")).toBeVisible();
  });

  test("schema nav visible for admin", async ({ page }) => {
    await prepareAdmin(page);
    await expect(page.getByTestId("nav-schema")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("nav-content")).toBeVisible();
  });

  test("editor cannot access settings exports", async ({ page }) => {
    await prepareEditor(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("insufficient-permissions")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("export-tools")).not.toBeVisible();
  });

  test("admin can access settings exports", async ({ page }) => {
    await prepareAdmin(page);
    await page.goto("/settings");
    await expect(page.getByTestId("export-tools")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("insufficient-permissions")).not.toBeVisible();
  });

  test("settings nav hidden for editor", async ({ page }) => {
    await prepareEditor(page);
    await expect(page.getByTestId("nav-settings")).not.toBeVisible();
    await expect(page.getByTestId("nav-content")).toBeVisible();
  });

  test("settings nav visible for admin", async ({ page }) => {
    await prepareAdmin(page);
    const settingsNav = page.getByTestId("nav-settings");
    await settingsNav.waitFor({ state: "attached", timeout: 30_000 });
    await settingsNav.scrollIntoViewIfNeeded();
    await expect(settingsNav).toBeVisible();
    await expect(page.getByTestId("nav-content")).toBeVisible();
  });

  test("editor cannot open settings via g+, shortcut", async ({ page }) => {
    await prepareEditor(page);
    await page.getByTestId("nav-home").waitFor({ timeout: 15_000 });

    await page.keyboard.press("g");
    await page.keyboard.press(",");
    await page.waitForLoadState("networkidle");

    await expect(page).not.toHaveURL(/\/settings/);
  });
});
