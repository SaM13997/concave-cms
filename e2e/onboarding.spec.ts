import { expect, test } from "@playwright/test";
import { signUp, waitForActiveContentType } from "./helpers/auth";

/**
 * Onboarding flow: Blog schema → first post → publish.
 * Target: complete within 2 minutes (RQ-520).
 */
test.describe("Onboarding", () => {
  test.setTimeout(120_000);

  test("E2E-ONB-01: admin completes onboarding wizard under 2 minutes", async ({ page }) => {
    const startedAt = Date.now();

    await signUp(page);
    await page.getByTestId("admin-chrome").waitFor({ timeout: 15_000 });
    await page.getByTestId("onboarding-wizard").waitFor({ timeout: 20_000 });
    await page.getByTestId("onboarding-start").click();
    await page.waitForURL("/schema**");
    await page.getByTestId("onboarding-schema-banner").waitFor();
    await page.getByTestId("schema-builder").waitFor();

    await page.getByTestId("schema-new-table-input").fill("Blog");
    await page.getByTestId("schema-create-table-button").click();
    await page.getByTestId("schema-table-blog").waitFor();

    await page.getByTestId("schema-add-field-button").click();
    await page.getByTestId("schema-field-name-field-2").waitFor();
    await page.getByTestId("schema-field-name-field-2").fill("Body");
    await page.getByTestId("schema-field-type-field-2").selectOption("richtext");
    await page.getByTestId("schema-field-slug-field-2").fill("body");
    await expect(page.getByTestId("schema-field-slug-body")).toHaveValue("body", {
      timeout: 10_000,
    });

    await page.getByTestId("schema-apply-button").click();
    await expect(page.getByTestId("schema-apply-success")).toBeVisible({ timeout: 15_000 });

    await waitForActiveContentType(page, "blog");
    await page.getByTestId(`content-type-blog`).click();

    await page.getByTestId("content-title-input").fill("Hello Concave");
    await page.getByTestId("content-create-button").click();
    await expect(page.getByTestId("content-entries-list").getByText("Hello Concave")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId("content-entries-list").getByText("Hello Concave").click();
    await page.getByTestId("content-field-input-body").fill("<p>My first published post</p>");
    await page.getByTestId("content-save-button").click();
    await expect(page.getByTestId("content-save-button")).toHaveText("Saved", { timeout: 10_000 });

    await page.getByTestId("content-publish-button").click();
    await expect(page.getByTestId("content-badge-published")).toBeVisible({ timeout: 10_000 });

    const entryButton = page.getByTestId("content-entries-list").getByText("Hello Concave");
    const entryTestId = await entryButton
      .locator("xpath=ancestor::button")
      .getAttribute("data-testid");
    const entryId = entryTestId?.replace("content-entry-", "") ?? "";

    await page.getByTestId("nav-home").click();
    await page.waitForURL("/");
    await page.getByTestId("onboarding-panel-complete").waitFor({ timeout: 15_000 });
    await page.getByTestId("onboarding-complete").click();
    await expect(page.getByTestId("onboarding-wizard")).toBeHidden({ timeout: 10_000 });

    await page.goto(`/p/${entryId}`);
    await expect(page.getByTestId("published-page")).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByTestId("published-body").or(page.getByTestId("published-data")),
    ).toContainText("My first published post");

    const elapsedMs = Date.now() - startedAt;
    expect(elapsedMs).toBeLessThan(120_000);
  });
});
