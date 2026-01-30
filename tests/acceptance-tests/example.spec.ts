import { test, expect } from "@playwright/test";

test("renders home page", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  await expect(page.getByText("Hello there")).toBeVisible();
});
