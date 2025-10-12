import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/MCP Gemini CLI/);
});

test("has header", async ({ page }) => {
  await page.goto("/");

  // Expect an h1 element to contain the correct text.
  await expect(page.locator("h1")).toContainText(
    "MCP Gemini CLI Web Interface",
  );
});
