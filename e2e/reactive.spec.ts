import { expect, test } from "@playwright/test";
import { assignRole, signUp } from "./helpers/auth";

async function prepareAuthenticatedPage(
  page: import("@playwright/test").Page,
  options?: { role?: "admin" | "editor" },
) {
  await signUp(page);
  if (options?.role) {
    await assignRole(page, options.role);
  }
  await page.reload();
  await page.waitForLoadState("networkidle");
}

test.describe("Reactive subscriptions", () => {
  test("two sessions observe live counter updates without refresh", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await prepareAuthenticatedPage(pageA, { role: "admin" });
    await prepareAuthenticatedPage(pageB, { role: "admin" });

    await pageA.goto("/debug/reactive");
    await pageB.goto("/debug/reactive");
    await pageA.waitForLoadState("networkidle");
    await pageB.waitForLoadState("networkidle");

    await expect(pageA.getByTestId("reactive-demo")).toBeVisible({ timeout: 15_000 });
    await expect(pageB.getByTestId("reactive-demo")).toBeVisible({ timeout: 15_000 });

    await expect(pageA.getByTestId("reactive-counter-value")).toHaveText("0", { timeout: 15_000 });
    await expect(pageB.getByTestId("reactive-counter-value")).toHaveText("0", { timeout: 15_000 });

    await pageA.getByTestId("reactive-counter-increment").click();

    await expect(pageA.getByTestId("reactive-counter-value")).toHaveText("1", { timeout: 10_000 });
    await expect(pageB.getByTestId("reactive-counter-value")).toHaveText("1", { timeout: 10_000 });

    await pageA.getByTestId("reactive-counter-increment").click();

    await expect(pageA.getByTestId("reactive-counter-value")).toHaveText("2", { timeout: 10_000 });
    await expect(pageB.getByTestId("reactive-counter-value")).toHaveText("2", { timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });

  test("content list updates live when entry created in another session", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await prepareAuthenticatedPage(pageA);
    await prepareAuthenticatedPage(pageB);

    await pageA.goto("/content");
    await pageB.goto("/content");
    await pageA.waitForLoadState("networkidle");
    await pageB.waitForLoadState("networkidle");

    await expect(pageA.getByTestId("content-editor")).toBeVisible({ timeout: 15_000 });
    await expect(pageB.getByTestId("content-editor")).toBeVisible({ timeout: 15_000 });

    await expect(pageA.getByTestId("content-entries-empty")).toBeVisible({ timeout: 15_000 });
    await expect(pageB.getByTestId("content-entries-empty")).toBeVisible({ timeout: 15_000 });

    await pageA.getByTestId("content-title-input").fill("Live update entry");
    await pageA.getByTestId("content-create-button").click();

    await expect(pageA.getByTestId("content-entries-list").getByText("Live update entry")).toBeVisible({
      timeout: 10_000,
    });
    await expect(pageB.getByTestId("content-entries-list").getByText("Live update entry")).toBeVisible({
      timeout: 10_000,
    });

    await contextA.close();
    await contextB.close();
  });
});
