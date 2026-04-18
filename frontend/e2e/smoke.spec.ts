import { test, expect } from "@playwright/test";

test.describe("Hero Slot Studio smoke", () => {
  test("app shell renders with empty state", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await expect(page).toHaveTitle(/Hero Slot Studio/);
    await expect(page.getByRole("heading", { name: /fetch a site to begin/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /fetch site/i })).toBeVisible();
  });
});
