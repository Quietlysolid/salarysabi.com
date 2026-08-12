import { expect, test } from "@playwright/test";

test.describe("work-and-pay platform redesign", () => {
  test("homepage presents the full platform and keeps the calculator usable", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Understand your pay/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Compare salaries", exact: true }).first()).toBeVisible();
    await expect(page.getByText("Built by a Nigerian, for Nigerians")).toBeVisible();
    await page.getByRole("link", { name: "Calculate my PAYE", exact: true }).first().click();
    await expect(page.locator("#calculator")).toBeInViewport();
    expect(consoleErrors).toEqual([]);
  });

  test("salary contribution validates identity-free context before pay details", async ({ page }) => {
    await page.goto("/salaries");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator('input[name="role"]')).toBeFocused();
    await page.locator('input[name="role"]').fill("Product designer");
    await page.locator('input[name="industry"]').fill("Technology");
    await page.locator('input[name="location"]').fill("Lagos");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Step 2 of 2")).toBeVisible();
    await expect(page.locator('input[name="gross"]')).toBeVisible();
  });

  test("homepage reflows without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("contributor programme explains approval and budget boundaries", async ({ page }) => {
    await page.goto("/contributors");
    await expect(page.getByRole("heading", { name: /Build credible work-and-pay information/i })).toBeVisible();
    await expect(page.getByText(/SalarySabi pays for accepted value/i)).toBeVisible();
    await expect(page.getByText(/Campaigns pause automatically/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Track reviews and rewards privately/i })).toBeVisible();
  });
});
