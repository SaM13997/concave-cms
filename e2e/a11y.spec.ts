import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assignRole, signUp, waitForAuth } from "./helpers/auth";

const CORE_ROUTES = ["/", "/content", "/schema", "/audit", "/settings"] as const;

async function prepareAdmin(page: import("@playwright/test").Page) {
  await signUp(page);
  await assignRole(page, "admin");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.getByTestId("admin-chrome").waitFor({ timeout: 15_000 });
}

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await prepareAdmin(page);
  });

  for (const route of CORE_ROUTES) {
    test(`axe: ${route} has no serious violations`, async ({ page }) => {
      if (route === "/") {
        await page.goto(route);
      } else {
        await page.getByTestId(`nav-${route.slice(1)}`).click();
        await page.waitForURL(`${route}**`);
      }
      await page.waitForLoadState("networkidle");
      await page.getByTestId("admin-chrome").waitFor({ timeout: 15_000 });

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .disableRules(["color-contrast"])
        .analyze();

      const serious = results.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical",
      );

      expect(serious).toEqual([]);
    });
  }

  test("skip link moves focus to main content", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("admin-chrome").waitFor({ timeout: 15_000 });
    const skipLink = page.getByRole("button", { name: "Skip to main content" });
    await skipLink.focus();
    await skipLink.click();
    await expect(page.locator("#main-content")).toBeFocused();
  });
});
