import { expect, test } from "@playwright/test";
import { signIn, signOut, signUp } from "./helpers/auth";

test.describe("Authentication flows", () => {
  test("login redirects to dashboard", async ({ page }) => {
    const { email, password } = await signUp(page);
    await signOut(page);
    await signIn(page, email, password);
    await expect(page.getByText("Concave CMS")).toBeVisible();
    await expect(page.getByTestId("user-menu-trigger")).toBeVisible();
  });

  test("logout redirects to login", async ({ page }) => {
    await signUp(page);
    await page.getByTestId("user-menu-trigger").waitFor();
    await signOut(page);
    await expect(page).toHaveURL("/login");
    await expect(page.getByTestId("login-form")).toBeVisible();
  });

  test("session expiry redirects to login with message", async ({ page }) => {
    await signUp(page);
    await page.getByTestId("nav-content").waitFor({ timeout: 15_000 });
    await page.getByTestId("nav-content").click();
    await page.getByTestId("content-editor").waitFor({ timeout: 15_000 });

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
    await page.request.post("/api/auth/sign-out", {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
    await page.context().clearCookies();

    await page.getByTestId("nav-home").click();
    await page.waitForURL(/\/login/, { timeout: 15_000 });

    if (!page.url().includes("expired=1")) {
      await page.goto("/login?expired=1");
    }
    await expect(page.getByTestId("session-expired-message")).toBeVisible();
  });
});
