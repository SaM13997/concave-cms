import { expect, test } from "@playwright/test";
import { assignRole, signUp, waitForActiveContentType } from "./helpers/auth";

async function prepareAdmin(page: import("@playwright/test").Page) {
  await signUp(page);
  await assignRole(page, "admin");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("nav-schema").waitFor({ timeout: 20_000 });
}

async function openSchemaBuilder(page: import("@playwright/test").Page) {
  await page.getByTestId("nav-schema").waitFor({ timeout: 15_000 });
  await page.getByTestId("nav-schema").click();
  await page.waitForURL("/schema");
  await page.getByTestId("schema-builder").waitFor();
}

async function createAndApplySchema(
  page: import("@playwright/test").Page,
  tableName: string,
  fields: Array<{ name: string; slug: string; type: string; referenceTo?: string }>,
) {
  await page.getByTestId("schema-new-table-input").fill(tableName);
  await page.getByTestId("schema-create-table-button").click();
  const slug = tableName.toLowerCase().replace(/\s+/g, "-");
  await page.getByTestId(`schema-table-${slug}`).waitFor();

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (!field) continue;
    const fieldSlug = `field-${i + 2}`;
    await page.getByTestId("schema-add-field-button").click();
    await page.getByTestId(`schema-field-name-${fieldSlug}`).waitFor();
    await page.getByTestId(`schema-field-name-${fieldSlug}`).fill(field.name);
    await page.getByTestId(`schema-field-type-${fieldSlug}`).selectOption(field.type);
    await expect(page.getByTestId(`schema-field-type-${fieldSlug}`)).toHaveValue(field.type, {
      timeout: 10_000,
    });
    await page.getByTestId(`schema-field-slug-${fieldSlug}`).fill(field.slug);
    await expect(page.getByTestId(`schema-field-slug-${field.slug}`)).toHaveValue(field.slug, {
      timeout: 10_000,
    });
    await expect(page.getByTestId(`schema-field-type-${field.slug}`)).toHaveValue(field.type, {
      timeout: 10_000,
    });
    if (field.type === "reference" && field.referenceTo) {
      const refSelect = page.getByTestId(`schema-field-reference-${field.slug}`);
      await refSelect.waitFor({ timeout: 15_000 });
      await refSelect.selectOption(field.referenceTo);
      await expect(refSelect).toHaveValue(field.referenceTo, { timeout: 10_000 });
    }
  }

  await page.getByTestId("schema-apply-button").click();
  await expect(page.getByTestId("schema-apply-success")).toBeVisible({ timeout: 15_000 });
}

test.describe("Content Engine", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await prepareAdmin(page);
  });

  test("E2E-CE-01: schema-driven create and edit with live updates", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await prepareAdmin(pageA);
    await prepareAdmin(pageB);

    await openSchemaBuilder(pageA);
    const blogName = `Blog${Date.now()}`;
    await createAndApplySchema(pageA, blogName, [
      { name: "Body", slug: "body", type: "richtext" },
    ]);

    const blogSlug = blogName.toLowerCase();

    await waitForActiveContentType(pageA, blogSlug);
    await pageA.getByTestId(`content-type-${blogSlug}`).click();
    await pageB.getByTestId("nav-content").click();
    await expect(pageB.getByTestId(`content-type-${blogSlug}`)).toBeVisible({ timeout: 30_000 });
    await pageB.getByTestId(`content-type-${blogSlug}`).click();

    await pageA.getByTestId("content-title-input").fill("My first post");
    await pageA.getByTestId("content-create-button").click();

    await expect(pageA.getByTestId("content-entries-list").getByText("My first post")).toBeVisible({
      timeout: 10_000,
    });
    await expect(pageB.getByTestId("content-entries-list").getByText("My first post")).toBeVisible({
      timeout: 10_000,
    });

    await pageA.getByTestId("content-entries-list").getByText("My first post").click();
    await pageA.getByTestId("content-field-input-body").fill("<p>Hello from CMS</p>");
    await pageA.getByTestId("content-save-button").click();
    await expect(pageA.getByTestId("content-save-button")).toHaveText("Saved", { timeout: 10_000 });

    await pageA.reload();
    await pageA.getByTestId(`content-type-${blogSlug}`).click();
    await pageA.getByTestId("content-entries-list").getByText("My first post").click();
    await expect(pageA.getByTestId("content-field-input-body")).toHaveValue("<p>Hello from CMS</p>", {
      timeout: 10_000,
    });

    await contextA.close();
    await contextB.close();
  });

  test("E2E-CE-02: create entry with rich text, image, and reference", async ({ page }) => {
    await openSchemaBuilder(page);

    const authorName = `Author${Date.now()}`;
    await createAndApplySchema(page, authorName, [
      { name: "Bio", slug: "bio", type: "text" },
    ]);

    const blogName = `BlogPost${Date.now()}`;
    const authorSlug = authorName.toLowerCase();
    await createAndApplySchema(page, blogName, [
      { name: "Body", slug: "body", type: "richtext" },
      { name: "Cover", slug: "cover", type: "image" },
      { name: "Author", slug: "author", type: "reference", referenceTo: authorSlug },
    ]);

    const blogSlug = blogName.toLowerCase();

    await waitForActiveContentType(page, authorSlug);
    await page.getByTestId(`content-type-${authorSlug}`).click();
    await page.getByTestId("content-title-input").fill("Jane Doe");
    await page.getByTestId("content-create-button").click();
    await expect(page.getByTestId("content-entries-list").getByText("Jane Doe")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId(`content-type-${blogSlug}`).click();
    await page.getByTestId("content-title-input").fill("Featured article");
    await page.getByTestId("content-create-button").click();
    await page.getByTestId("content-entries-list").getByText("Featured article").click();

    await page.getByTestId("content-field-input-body").fill("<h1>Featured</h1><p>Rich content here</p>");

    const tinyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    await page.getByTestId("content-field-upload-cover").setInputFiles({
      name: "cover.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });
    await expect(page.getByTestId("content-field-preview-cover")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("content-field-input-author").selectOption({ label: "Jane Doe" });
    await page.getByTestId("content-save-button").click();
    await expect(page.getByTestId("content-save-button")).toHaveText("Saved", { timeout: 10_000 });

    await page.reload();
    await page.getByTestId(`content-type-${blogSlug}`).click();
    await page.getByTestId("content-entries-list").getByText("Featured article").click();

    await expect(page.getByTestId("content-field-input-body")).toHaveValue(
      "<h1>Featured</h1><p>Rich content here</p>",
      { timeout: 10_000 },
    );
    await expect(page.getByTestId("content-field-preview-cover")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("content-resolved-ref-author")).toContainText("Jane Doe");
  });
});
