import { expect, test } from "@playwright/test";
import { assignRole, signUp } from "./helpers/auth";

async function prepareAdmin(page: import("@playwright/test").Page) {
  await signUp(page);
  await assignRole(page, "admin");
  await page.reload();
  await page.waitForLoadState("networkidle");
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
  fields: Array<{ name: string; slug: string; type: string }>,
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
    await page.getByTestId(`schema-field-slug-${fieldSlug}`).fill(field.slug);
    await expect(page.getByTestId(`schema-field-slug-${field.slug}`)).toHaveValue(field.slug, {
      timeout: 10_000,
    });
  }

  await page.getByTestId("schema-apply-button").click();
  await expect(page.getByTestId("schema-apply-success")).toBeVisible({ timeout: 15_000 });

  return slug;
}

test.describe("Draft/publish lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await prepareAdmin(page);
  });

  test("E2E-DP-01: draft edits do not appear in published view until publish", async ({
    page,
  }) => {
    await openSchemaBuilder(page);
    const blogName = `PublishBlog${Date.now()}`;
    const blogSlug = await createAndApplySchema(page, blogName, [
      { name: "Body", slug: "body", type: "richtext" },
    ]);

    await page.goto("/content");
    await page.getByTestId("content-editor").waitFor({ timeout: 15_000 });
    await page.getByTestId(`content-type-${blogSlug}`).click();

    await page.getByTestId("content-title-input").fill("Publish test post");
    await page.getByTestId("content-create-button").click();
    await expect(page.getByTestId("content-entries-list").getByText("Publish test post")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId("content-entries-list").getByText("Publish test post").click();
    await page.getByTestId("content-field-input-body").fill("<p>Published body</p>");
    await page.getByTestId("content-save-button").click();
    await expect(page.getByTestId("content-save-button")).toHaveText("Saved", { timeout: 10_000 });

    await expect(page.getByTestId("content-badge-draft")).toBeVisible();
    const entryButton = page.getByTestId("content-entries-list").getByText("Publish test post");
    const entryTestId = await entryButton
      .locator("xpath=ancestor::button")
      .getAttribute("data-testid");
    const entryId = entryTestId?.replace("content-entry-", "") ?? "";

    await page.goto(`/p/${entryId}`);
    await expect(page.getByTestId("published-not-found")).toBeVisible({ timeout: 10_000 });

    await page.goto("/content");
    await page.getByTestId(`content-type-${blogSlug}`).click();
    await page.getByTestId("content-entries-list").getByText("Publish test post").click();

    await page.getByTestId("content-publish-button").click();
    await expect(page.getByTestId("content-badge-published")).toBeVisible({ timeout: 10_000 });

    await page.goto(`/p/${entryId}`);
    await expect(page.getByTestId("published-page")).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByTestId("published-body").or(page.getByTestId("published-data")),
    ).toContainText("Published body");

    await page.goto("/content");
    await page.getByTestId(`content-type-${blogSlug}`).click();
    await page.getByTestId("content-entries-list").getByText("Publish test post").click();
    await page.getByTestId("content-field-input-body").fill("<p>Draft-only body</p>");
    await page.getByTestId("content-save-button").click();
    await expect(page.getByTestId("content-badge-unpublished-changes")).toBeVisible({
      timeout: 10_000,
    });

    await page.goto(`/p/${entryId}`);
    const publishedView = page.getByTestId("published-body").or(page.getByTestId("published-data"));
    await expect(publishedView).toContainText("Published body");
    await expect(publishedView).not.toContainText("Draft-only body");
  });

  test("E2E-DP-02: preview shows draft; published view shows published", async ({ page }) => {
    await openSchemaBuilder(page);
    const blogName = `PreviewBlog${Date.now()}`;
    const blogSlug = await createAndApplySchema(page, blogName, [
      { name: "Body", slug: "body", type: "richtext" },
    ]);

    await page.goto("/content");
    await page.getByTestId(`content-type-${blogSlug}`).click();
    await page.getByTestId("content-title-input").fill("Preview post");
    await page.getByTestId("content-create-button").click();
    await page.getByTestId("content-entries-list").getByText("Preview post").click();

    await page.getByTestId("content-field-input-body").fill("<p>Preview draft content</p>");
    await page.getByTestId("content-save-button").click();
    await expect(page.getByTestId("content-save-button")).toHaveText("Saved", { timeout: 10_000 });

    await page.getByTestId("content-preview-generate").click();
    await expect(page.getByTestId("content-preview-url")).toBeVisible({ timeout: 10_000 });

    const previewUrl = await page.getByTestId("content-preview-url").inputValue();
    await page.goto(previewUrl);
    await expect(page.getByTestId("preview-page")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("preview-title")).toContainText("Preview post");
    const previewBody = page.getByTestId("preview-body");
    const previewData = page.getByTestId("preview-data");
    await expect(previewBody.or(previewData)).toContainText("Preview draft content", {
      timeout: 10_000,
    });

    await page.goto("/content");
    await page.getByTestId(`content-type-${blogSlug}`).click();
    await page.getByTestId("content-entries-list").getByText("Preview post").click();
    await page.getByTestId("content-publish-button").click();
    await expect(page.getByTestId("content-badge-published")).toBeVisible({ timeout: 10_000 });

    const entryButton = page.getByTestId("content-entries-list").getByText("Preview post");
    const entryTestId = await entryButton
      .locator("xpath=ancestor::button")
      .getAttribute("data-testid");
    const entryId = entryTestId?.replace("content-entry-", "") ?? "";

    await page.goto(`/p/${entryId}`);
    await expect(
      page.getByTestId("published-body").or(page.getByTestId("published-data")),
    ).toContainText("Preview draft content");

    await page.goto("/content");
    await page.getByTestId(`content-type-${blogSlug}`).click();
    await page.getByTestId("content-entries-list").getByText("Preview post").click();
    await page.getByTestId("content-field-input-body").fill("<p>Updated after publish</p>");
    await page.getByTestId("content-save-button").click();
    await expect(page.getByTestId("content-save-button")).toHaveText("Saved", { timeout: 10_000 });
    await expect(page.getByTestId("content-badge-unpublished-changes")).toBeVisible({
      timeout: 10_000,
    });

    await page.goto(previewUrl);
    await expect(page.getByTestId("preview-invalid")).toBeVisible({ timeout: 10_000 });

    await page.goto("/content");
    await page.getByTestId(`content-type-${blogSlug}`).click();
    await page.getByTestId("content-entries-list").getByText("Preview post").click();
    await page.getByTestId("content-preview-regenerate").click();
    const newPreviewUrl = await page.getByTestId("content-preview-url").inputValue();
    await page.goto(newPreviewUrl);
    await expect(page.getByTestId("preview-body").or(page.getByTestId("preview-data"))).toContainText(
      "Updated after publish",
      { timeout: 10_000 },
    );

    await page.goto(`/p/${entryId}`);
    await expect(
      page.getByTestId("published-body").or(page.getByTestId("published-data")),
    ).toContainText("Preview draft content");
    await expect(
      page.getByTestId("published-body").or(page.getByTestId("published-data")),
    ).not.toContainText("Updated after publish");
  });
});
