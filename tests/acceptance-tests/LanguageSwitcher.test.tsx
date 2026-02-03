import enMessages from "@/messages/en.json";
import svMessages from "@/messages/sv.json";
import { test, expect } from "@playwright/test";

test.describe("Language Switcher Functionality", () => {
  test("should switch from English to Swedish", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText(enMessages.HomePage.title)).toBeVisible();

    // Open language switcher and select Swedish
    await page.getByRole("button", { name: "English" }).click();
    await page.getByRole("menuitem", { name: "Svenska" }).click();

    // Wait for navigation and verify URL and content changed to Swedish
    await page.waitForURL("**/sv");
    await expect(page.getByText(svMessages.HomePage.title)).toBeVisible();
  });

  test("should switch from Swedish to English", async ({ page }) => {
    await page.goto("/sv");
    await expect(page.getByText(svMessages.HomePage.title)).toBeVisible();

    // Open language switcher and select English
    await page.getByRole("button", { name: "Svenska" }).click();
    await page.getByRole("menuitem", { name: "English" }).click();

    // Wait for navigation and verify URL and content changed to English
    await page.waitForURL("**/en");
    await expect(page.getByText(enMessages.HomePage.title)).toBeVisible();
  });
});
