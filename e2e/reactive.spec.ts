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

async function resetReactiveCounter(page: import("@playwright/test").Page): Promise<void> {
  const token = await page.evaluate(async () => {
    const response = await fetch("/api/auth/convex/token", { credentials: "include" });
    if (!response.ok) return null;
    const data = (await response.json()) as { token?: string };
    return data.token ?? null;
  });
  if (!token) return;
  const client = new ConvexHttpClient(getConvexUrl());
  client.setAuth(token);
  await client.mutation(api.debugReactive.resetReactiveCounter, {});
}

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
    await resetReactiveCounter(pageA);

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

    await prepareAuthenticatedPage(pageA, { role: "admin" });
    await prepareAuthenticatedPage(pageB, { role: "admin" });

    await pageA.getByTestId("nav-schema").waitFor({ timeout: 15_000 });
    await pageA.getByTestId("nav-schema").click();
    await pageA.waitForURL("/schema");
    await pageA.getByTestId("schema-builder").waitFor({ timeout: 15_000 });
    const postType = `Post${Date.now()}`;
    await pageA.getByTestId("schema-new-table-input").fill(postType);
    await pageA.getByTestId("schema-create-table-button").click();
    const postSlug = postType.toLowerCase();
    await pageA.getByTestId(`schema-table-${postSlug}`).waitFor();
    await pageA.getByTestId("schema-apply-button").click();
    await expect(pageA.getByTestId("schema-apply-success")).toBeVisible({ timeout: 15_000 });

    await pageA.goto("/content");
    await pageB.goto("/content");
    await pageA.waitForLoadState("networkidle");
    await pageB.waitForLoadState("networkidle");

    await expect(pageA.getByTestId("content-editor")).toBeVisible({ timeout: 15_000 });
    await expect(pageB.getByTestId("content-editor")).toBeVisible({ timeout: 15_000 });

    await pageA.getByTestId(`content-type-${postSlug}`).click();
    await pageB.getByTestId(`content-type-${postSlug}`).click();

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
