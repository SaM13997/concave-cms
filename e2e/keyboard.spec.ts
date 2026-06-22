import { expect, test } from "@playwright/test";
import { assignRole, signUp } from "./helpers/auth";

async function prepareAdmin(page: import("@playwright/test").Page) {
  await signUp(page);
  await assignRole(page, "admin");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.getByTestId("admin-chrome").waitFor({ timeout: 15_000 });
}

test.describe("Keyboard navigation", () => {
  test("Cmd+K opens command palette and arrow keys navigate results", async ({ page }) => {
    await prepareAdmin(page);

    await page.getByTestId("nav-schema").click();
    await page.waitForURL("/schema**");
    await page.getByTestId("schema-new-table-input").fill(`Keyboard-${Date.now()}`);
    await page.getByTestId("schema-create-table-button").click();

    await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
    await expect(page.getByTestId("command-palette")).toBeVisible();
    await expect(page.getByTestId("command-palette-input")).toBeFocused();

    await page.getByTestId("command-palette-input").fill("Keyboard");
    await expect(page.getByTestId("command-palette-results").getByRole("button").first()).toBeVisible({
      timeout: 10_000,
    });

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("command-palette")).not.toBeVisible();
  });

  test("schema builder supports keyboard field navigation", async ({ page }) => {
    await prepareAdmin(page);
    await page.getByTestId("nav-schema").click();
    await page.waitForURL("/schema**");
    await page.getByTestId("schema-builder").waitFor();

    const tableName = `KeyNav-${Date.now()}`;
    await page.getByTestId("schema-new-table-input").fill(tableName);
    await page.getByTestId("schema-create-table-button").click();

    const slug = tableName.toLowerCase();
    await page.getByTestId(`schema-table-${slug}`).click();
    await page.getByTestId("schema-add-field-button").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("schema-field-name-field-2")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("schema-field-name-field-2").fill("Summary");
  });
});
