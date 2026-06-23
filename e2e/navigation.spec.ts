import { expect, test } from "@playwright/test";
import { prepareAdmin, prepareEditor } from "./helpers/auth";

test.describe("Fluid navigation (admin)", () => {
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

    await page.getByTestId("nav-media").click();
    await page.waitForURL("/media**");
    await expect(page.getByTestId("media-library")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("breadcrumb-current")).toHaveText("Media");

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
    await page.keyboard.press("m");
    await page.waitForURL("/media**");
    await expect(page.getByTestId("media-library")).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("g");
    await page.keyboard.press("s");
    await page.waitForURL("/schema**");
    await expect(page.getByTestId("schema-builder")).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("g");
    await page.keyboard.press("a");
    await page.waitForURL("/audit**");
    await expect(page.getByTestId("audit-log-viewer")).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("g");
    await page.keyboard.press(",");
    await page.waitForURL("/settings**");
    await expect(page.getByTestId("export-tools")).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("g");
    await page.keyboard.press("h");
    await page.waitForURL("/");
  });

  test("E2E-NAV-04: admin sees debug and live bottom-nav items", async ({ page }) => {
    await expect(page.getByTestId("nav-debug")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("nav-live")).toBeVisible();

    await page.getByTestId("nav-debug").click();
    await page.waitForURL("/debug/system**");
    await expect(page.getByTestId("debug-system")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("nav-live").click();
    await page.waitForURL("/debug/reactive**");
    await expect(page.getByTestId("reactive-demo")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Fluid navigation (editor)", () => {
  test("E2E-NAV-03: editor sees content and media nav, not schema or settings cards", async ({
    page,
  }) => {
    await prepareEditor(page);

    await expect(page.getByTestId("nav-content")).toBeVisible();
    await expect(page.getByTestId("nav-media")).toBeVisible();
    await expect(page.getByTestId("nav-schema")).not.toBeVisible();
    await expect(page.getByTestId("nav-settings")).not.toBeVisible();
    await expect(page.getByTestId("nav-debug")).not.toBeVisible();
    await expect(page.getByTestId("nav-live")).not.toBeVisible();

    await expect(page.getByRole("link", { name: /Content Entries/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Media Library/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Content Types/i })).not.toBeVisible();
    await expect(page.getByRole("link", { name: /Settings/i })).not.toBeVisible();
  });
});
