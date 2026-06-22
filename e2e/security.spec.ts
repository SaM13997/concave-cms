import { expect, test } from "@playwright/test";
import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "node:fs";
import { assignRole, signUp } from "./helpers/auth";
import { api } from "../convex/_generated/api";

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
  return process.env.VITE_CONVEX_URL ?? "http://127.0.0.1:3210";
}

async function getToken(page: import("@playwright/test").Page): Promise<string> {
  const token = await page.evaluate(async () => {
    const response = await fetch("/api/auth/convex/token", { credentials: "include" });
    if (!response.ok) return null;
    const data = (await response.json()) as { token?: string };
    return data.token ?? null;
  });
  if (!token) throw new Error("Missing auth token");
  return token;
}

test.describe("Security regression", () => {
  test("editor cannot assign admin role via E2E mutation without secret", async ({ page }) => {
    await signUp(page);
    const client = new ConvexHttpClient(getConvexUrl());
    client.setAuth(await getToken(page));

    await expect(
      client.mutation(api.cmsUsers.assignRoleForE2e, {
        role: "admin",
        secret: "wrong-secret",
      }),
    ).rejects.toThrow();
  });

  test("expired preview token returns null content", async ({ page }) => {
    await signUp(page);
    const client = new ConvexHttpClient(getConvexUrl());
    client.setAuth(await getToken(page));

    const status = await client.query(api.publicContent.getPreviewTokenStatus, {
      token: "expired-token-not-found",
    });

    expect(status.valid).toBe(false);
  });

  test("audit log records schema apply and publish", async ({ page }) => {
    await signUp(page);
    await assignRole(page, "admin");
    await page.reload({ waitUntil: "networkidle" });
    await page.getByTestId("nav-schema").waitFor({ timeout: 15_000 });

    const unique = `AuditSec${Date.now()}`;
    await page.getByTestId("nav-schema").click();
    await page.getByTestId("schema-new-table-input").fill(unique);
    await page.getByTestId("schema-create-table-button").click();
    const slug = unique.toLowerCase();
    await page.getByTestId(`schema-table-${slug}`).waitFor({ timeout: 15_000 });
    await page.getByTestId("schema-apply-button").click();
    await expect(page.getByTestId("schema-apply-success")).toBeVisible({ timeout: 15_000 });

    const client = new ConvexHttpClient(getConvexUrl());
    client.setAuth(await getToken(page));

    await expect.poll(
      async () => {
        const types = await client.query(api.content.listContentTypes, {});
        return types.some((type) => type.slug === slug);
      },
      { timeout: 60_000 },
    ).toBe(true);

    const entry = await client.mutation(api.content.createContentEntry, {
      contentType: slug,
      title: `${unique} entry`,
      data: {},
    });
    await client.mutation(api.content.publishContentEntry, { entryId: entry._id });

    const audit = await client.query(api.auditLog.listAuditLog, {
      paginationOpts: { numItems: 50, cursor: null },
    });

    const actions = audit.page.map((entry) => entry.action);
    expect(actions).toContain("schema.apply");
    expect(actions).toContain("content.publish");
  });
});
