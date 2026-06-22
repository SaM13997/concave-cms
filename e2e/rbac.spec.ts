import { expect, test } from "@playwright/test";
import { assignRole, signUp } from "./helpers/auth";

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
    await signUp(page);
    await assignRole(page, "admin");
    await page.reload();
    await page.waitForLoadState("networkidle");
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
    await signUp(page);
    await assignRole(page, "admin");
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByTestId("nav-home").waitFor();
    await expect(page.getByTestId("nav-schema")).toBeVisible();
    await expect(page.getByTestId("nav-content")).toBeVisible();
  });
});
