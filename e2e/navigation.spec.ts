import { expect, test } from "@playwright/test";
import { assignRole, signUp } from "./helpers/auth";

async function prepareAdmin(page: import("@playwright/test").Page) {
  await signUp(page);
  await assignRole(page, "admin");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.getByTestId("admin-chrome").waitFor({ timeout: 15_000 });
}

test.describe("Fluid navigation", () => {
  test.beforeEach(async ({ page }) => {
    await prepareAdmin(page);
  });

  test("E2E-NAV-01: primary navigation paths and breadcrumbs", async ({ page }) => {
    await expect(page.getByTestId("admin-chrome")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("breadcrumbs")).toBeVisible();

    await page.getByTestId("nav-content").click();
    await page.waitForURL("/content**");
    await expect(page.getByTestId("content-editor")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("breadcrumb-current")).toHaveText("Content");

    await page.getByTestId("nav-schema").click();
    await page.waitForURL("/schema**");
    await expect(page.getByTestId("schema-builder")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("breadcrumb-current")).toHaveText("Schema");

    await page.getByTestId("nav-home").click();
    await page.waitForURL("/");
    await expect(page.getByTestId("breadcrumb-current")).toHaveText("Home");
  });

  test("E2E-NAV-02: keyboard go shortcuts navigate core routes", async ({ page }) => {
    await page.getByTestId("admin-chrome").waitFor({ timeout: 15_000 });

    await page.keyboard.press("g");
    await page.keyboard.press("c");
    await page.waitForURL("/content**");
    await expect(page.getByTestId("content-editor")).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("g");
    await page.keyboard.press("s");
    await page.waitForURL("/schema**");
    await expect(page.getByTestId("schema-builder")).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("g");
    await page.keyboard.press("h");
    await page.waitForURL("/");
  });
});
