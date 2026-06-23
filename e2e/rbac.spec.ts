import { expect, test } from "@playwright/test";
import { prepareAdmin, prepareEditor } from "./helpers/auth";

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
    await prepareEditor(page);
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
    await prepareEditor(page);
    await openContentEditor(page);
    await expect(page.getByTestId("content-editor")).toBeVisible();
  });

  test("schema nav hidden for editor", async ({ page }) => {
    await prepareEditor(page);
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
    await settingsNav.waitFor({ state: "visible", timeout: 30_000 });
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

  test("debug and live nav hidden for editor", async ({ page }) => {
    await prepareEditor(page);
    await page.getByTestId("nav-home").waitFor({ timeout: 15_000 });
    await expect(page.getByTestId("nav-debug")).not.toBeVisible();
    await expect(page.getByTestId("nav-live")).not.toBeVisible();
    await expect(page.getByTestId("nav-content")).toBeVisible();
  });

  test("debug and live nav visible for admin", async ({ page }) => {
    await prepareAdmin(page);
    await expect(page.getByTestId("nav-debug")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("nav-live")).toBeVisible();
  });

  test("editor can still open live debug page via direct URL", async ({ page }) => {
    await prepareEditor(page);
    await page.goto("/debug/reactive");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("reactive-demo")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("insufficient-permissions")).not.toBeVisible();
  });

  test("editor cannot open system debug page via direct URL", async ({ page }) => {
    await prepareEditor(page);
    await page.goto("/debug/system");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("insufficient-permissions")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("debug-system")).not.toBeVisible();
  });
});
