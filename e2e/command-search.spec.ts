import { expect, test } from "@playwright/test";
import { assignRole, createTestMediaAsset, signUp } from "./helpers/auth";

async function prepareAdmin(page: import("@playwright/test").Page) {
  await signUp(page);
  await assignRole(page, "admin");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.getByTestId("admin-chrome").waitFor({ timeout: 15_000 });
}

async function openCommandPalette(page: import("@playwright/test").Page) {
  await page.getByTestId("command-palette-trigger").click();
  await expect(page.getByTestId("command-palette")).toBeVisible({ timeout: 10_000 });
}

async function createAndApplySchema(page: import("@playwright/test").Page, tableName: string) {
  await page.getByTestId("nav-schema").click();
  await page.waitForURL("/schema**");
  await page.getByTestId("schema-builder").waitFor({ timeout: 15_000 });
  await page.getByTestId("schema-new-table-input").fill(tableName);
  await page.getByTestId("schema-create-table-button").click();
  const slug = tableName.toLowerCase().replace(/\s+/g, "-");
  await page.getByTestId(`schema-table-${slug}`).waitFor();
  await page.getByTestId("schema-apply-button").click();
  await expect(page.getByTestId("schema-apply-success")).toBeVisible({ timeout: 15_000 });
  return slug;
}

test.describe("Cmd+K global search", () => {
  test("E2E-SEARCH-01: admin finds content, schema, and media", async ({ page }) => {
    await prepareAdmin(page);

    const unique = `SearchTarget${Date.now()}`;
    const schemaSlug = await createAndApplySchema(page, unique);

    const mediaFilename = `${unique}-cover.png`;
    await createTestMediaAsset(page, mediaFilename);

    await page.goto("/content");
    await page.getByTestId("content-editor").waitFor({ timeout: 15_000 });
    await page.getByTestId(`content-type-${schemaSlug}`).click();
    await page.waitForURL(`**/content?type=${schemaSlug}**`);

    const entryTitle = `${unique} Entry`;
    await page.getByTestId("content-title-input").fill(entryTitle);
    await page.getByTestId("content-create-button").click();
    await expect(page.getByTestId("content-edit-title")).toHaveValue(entryTitle, {
      timeout: 15_000,
    });

    await openCommandPalette(page);

    await page.getByTestId("command-palette-input").fill(entryTitle);
    await expect(page.getByTestId("command-palette-group-content")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("command-palette-group-content").getByText(entryTitle)).toBeVisible();

    await page.getByTestId("command-palette-input").fill(unique);
    await expect(page.getByTestId("command-palette-group-schema")).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByTestId("command-palette-group-schema").getByText(unique, { exact: true }),
    ).toBeVisible();

    await page.getByTestId("command-palette-input").fill(mediaFilename);
    await expect(page.getByTestId("command-palette-group-media")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("command-palette-group-media").getByText(mediaFilename)).toBeVisible();
  });

  test("E2E-SEARCH-02: editor never sees schema results", async ({ page }) => {
    await signUp(page);
    await page.getByTestId("admin-chrome").waitFor({ timeout: 15_000 });

    await openCommandPalette(page);
    await page.getByTestId("command-palette-input").fill("schema");
    await expect(page.getByTestId("command-palette-group-schema")).not.toBeVisible({
      timeout: 5_000,
    });
  });
});
