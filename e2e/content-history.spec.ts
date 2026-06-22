import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { assignRole, CONVEX_URL, signUp, waitForActiveContentType } from "./helpers/auth";

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

async function getConvexAuthToken(page: import("@playwright/test").Page): Promise<string> {
  const token = await page.evaluate(async () => {
    const response = await fetch("/api/auth/convex/token", { credentials: "include" });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { token?: string };
    return data.token ?? null;
  });

  if (!token) {
    throw new Error("Could not obtain Convex auth token");
  }

  return token;
}

function getConvexUrl(): string {
  try {
    const env = readFileSync(".env.local", "utf8");
    const match = env.match(/^VITE_CONVEX_URL=(.+)$/m);
    if (match?.[1]) {
      return match[1].trim();
    }
  } catch {
    // fall through
  }
  return CONVEX_URL;
}

test.describe("Content history and revert", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await prepareAdmin(page);
  });

  test("E2E-CH-01: revert restores prior version and creates audit event", async ({ page }) => {
    await openSchemaBuilder(page);
    const blogName = `HistoryBlog${Date.now()}`;
    const blogSlug = await createAndApplySchema(page, blogName, [
      { name: "Body", slug: "body", type: "richtext" },
    ]);

    await waitForActiveContentType(page, blogSlug);
    await page.getByTestId(`content-type-${blogSlug}`).click();

    await page.getByTestId("content-title-input").fill("History test post");
    await page.getByTestId("content-create-button").click();
    await expect(page.getByTestId("content-entries-list").getByText("History test post")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId("content-entries-list").getByText("History test post").click();
    await page.getByTestId("content-field-input-body").fill("<p>Version one</p>");
    await page.getByTestId("content-save-button").click();
    await expect(page.getByTestId("content-save-button")).toHaveText("Saved", { timeout: 10_000 });

    await page.getByTestId("content-publish-button").click();
    await expect(page.getByTestId("content-badge-published")).toBeVisible({ timeout: 10_000 });

    await page.getByTestId("content-field-input-body").fill("<p>Version two draft</p>");
    await page.getByTestId("content-save-button").click();
    await expect(page.getByTestId("content-save-button")).toHaveText("Saved", { timeout: 10_000 });

    await page.getByTestId("content-history-panel").waitFor({ timeout: 10_000 });
    const publishEvent = page
      .getByTestId("content-history-timeline")
      .locator("li")
      .filter({ hasText: "Published" })
      .first();
    await expect(publishEvent).toBeVisible();

    const publishEventTestId = await publishEvent.getAttribute("data-testid");
    const publishEventId = publishEventTestId?.replace("content-history-event-", "") ?? "";

    await page.getByTestId(`content-history-revert-${publishEventId}`).click();
    await page.getByTestId("content-history-revert-confirm-button").click();

    await expect(page.getByTestId("content-field-input-body")).toHaveValue("<p>Version one</p>", {
      timeout: 10_000,
    });

    await expect(
      page.getByTestId("content-history-timeline").getByText('Reverted "History test post"'),
    ).toBeVisible({
      timeout: 10_000,
    });

    const token = await getConvexAuthToken(page);
    const client = new ConvexHttpClient(getConvexUrl());
    client.setAuth(token);

    const auditLog = await client.query(api.systemDebug.listRecentAuditLog, {
      paginationOpts: { numItems: 20, cursor: null },
    });

    const revertAudit = auditLog.page.find((entry) => entry.action === "content.revert");
    expect(revertAudit).toBeTruthy();
  });
});
