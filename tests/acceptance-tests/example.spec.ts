import { test, expect } from "@playwright/test";

test("renders home page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Hello there")).toBeVisible();
});
