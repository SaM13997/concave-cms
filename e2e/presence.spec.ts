import { expect, test } from "@playwright/test";
import { assignRole, disconnectPresence, signOut, signUp } from "./helpers/auth";

async function prepareAuthenticatedPage(
  page: import("@playwright/test").Page,
  options?: { role?: "admin" | "editor"; name?: string },
) {
  await signUp(page, options?.name ? { name: options.name } : undefined);
  if (options?.role) {
    await assignRole(page, options.role);
  }
  await page.reload();
  await page.waitForLoadState("networkidle");
}

test.describe("Presence indicators", () => {
  test("E2E-PRESENCE-01: two sessions show presence; disconnect clears", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await prepareAuthenticatedPage(pageA, { role: "admin", name: "Alice Admin" });
    await prepareAuthenticatedPage(pageB, { role: "admin", name: "Bob Admin" });

    const route = "/";
    await pageA.goto(route);
    await pageB.goto(route);
    await pageA.waitForLoadState("networkidle");
    await pageB.waitForLoadState("networkidle");

    await expect(pageA.getByTestId("presence-indicator")).toBeVisible({ timeout: 15_000 });
    await expect(pageB.getByTestId("presence-indicator")).toBeVisible({ timeout: 15_000 });

    await expect(pageA.getByTestId("presence-indicator")).toHaveAttribute("data-presence-count", "1", {
      timeout: 20_000,
    });
    await expect(pageB.getByTestId("presence-indicator")).toHaveAttribute("data-presence-count", "1", {
      timeout: 20_000,
    });

    await expect(pageA.getByTestId("presence-viewers").locator("li")).toHaveCount(1, {
      timeout: 20_000,
    });
    await expect(pageB.getByTestId("presence-viewers").locator("li")).toHaveCount(1, {
      timeout: 20_000,
    });

    await disconnectPresence(pageA);
    await signOut(pageA);

    await expect(pageB.getByTestId("presence-indicator")).toHaveAttribute("data-presence-count", "0", {
      timeout: 20_000,
    });
    await expect(pageB.getByTestId("presence-viewers")).not.toBeVisible({ timeout: 10_000 });

    await contextA.close();

    await contextB.close();
  });

  test("E2E-PRESENCE-02: save shows success toast", async ({ page }) => {
    await prepareAuthenticatedPage(page, { role: "admin" });

    await page.getByTestId("nav-schema").click();
    await page.waitForURL("/schema**");
    const postType = `ToastPost${Date.now()}`;
    await page.getByTestId("schema-new-table-input").fill(postType);
    await page.getByTestId("schema-create-table-button").click();
    const postSlug = postType.toLowerCase();
    await page.getByTestId(`schema-table-${postSlug}`).waitFor();
    await page.getByTestId("schema-apply-button").click();
    await expect(page.getByTestId("schema-apply-success")).toBeVisible({ timeout: 15_000 });

    await page.goto("/content");
    await page.getByTestId(`content-type-${postSlug}`).click();
    await page.getByTestId("content-title-input").fill("Toast test entry");
    await page.getByTestId("content-create-button").click();
    await expect(page.getByTestId("toast-success")).toBeVisible({ timeout: 10_000 });
  });
});
