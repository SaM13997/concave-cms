import { expect, test } from "@playwright/test";
import { prepareAdmin } from "./helpers/auth";

async function openSchemaBuilder(page: import("@playwright/test").Page) {
  await page.getByTestId("nav-schema").click();
  await page.waitForURL("/schema");
  await page.getByTestId("schema-builder").waitFor();
}

test.describe("Schema Builder", () => {
  test.beforeEach(async ({ page }) => {
    await prepareAdmin(page);
    await openSchemaBuilder(page);
  });

  test("E2E-SA-01: admin builds Blog schema and applies successfully", async ({ page }) => {
    await page.getByTestId("schema-new-table-input").fill("Blog");
    await page.getByTestId("schema-create-table-button").click();
    await page.getByTestId("schema-table-blog").waitFor();

    await page.getByTestId("schema-add-field-button").click();
    await page.getByTestId("schema-field-name-field-2").waitFor();
    await page.getByTestId("schema-field-name-field-2").fill("Body");
    await page.getByTestId("schema-field-type-field-2").selectOption("richtext");
    await page.getByTestId("schema-field-slug-field-2").fill("body");

    await page.getByTestId("schema-add-field-button").click();
    await page.getByTestId("schema-field-name-field-3").waitFor();
    await page.getByTestId("schema-field-name-field-3").fill("Published");
    await page.getByTestId("schema-field-type-field-3").selectOption("boolean");
    await page.getByTestId("schema-field-slug-field-3").fill("published");

    await page.getByTestId("schema-apply-button").click();
    await expect(page.getByTestId("schema-apply-success")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("schema-status-badge")).toHaveText("active");
  });

  test("E2E-SA-02: invalid reference shows validation errors", async ({ page }) => {
    const tableName = `RefTest-${Date.now()}`;
    await page.getByTestId("schema-new-table-input").fill(tableName);
    await page.getByTestId("schema-create-table-button").click();
    const slug = tableName.toLowerCase();
    await page.getByTestId(`schema-table-${slug}`).waitFor();

    await page.getByTestId("schema-add-field-button").click();
    await page.getByTestId("schema-field-type-field-2").waitFor({ timeout: 10_000 });
    await page.getByTestId("schema-field-type-field-2").selectOption("reference");

    await expect(page.getByTestId("schema-validation-errors")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("schema-apply-button")).toBeDisabled();
  });

  test("E2E-SA-04: export produces downloadable JSON", async ({ page }) => {
    const tableName = `ExportTest-${Date.now()}`;
    await page.getByTestId("schema-new-table-input").fill(tableName);
    await page.getByTestId("schema-create-table-button").click();
    const slug = tableName.toLowerCase();
    await page.getByTestId(`schema-table-${slug}`).waitFor();

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("schema-export-button").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("schema-export.json");
  });
});
