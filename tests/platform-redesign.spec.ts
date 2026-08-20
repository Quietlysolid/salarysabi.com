import { expect, test } from "@playwright/test";

test.describe("work-and-pay platform redesign", () => {
  test("homepage presents the full platform and keeps the calculator usable", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Check your take-home pay/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "For me", exact: true }).first()).toHaveAttribute("aria-current", "page");
    await page.getByLabel("Salary before deductions").fill("750000");
    await page.getByRole("button", { name: "Calculate take-home pay" }).click();
    await expect(page.getByRole("link", { name: /Verify with my payslip/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Compare my salary/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Find jobs with published pay/i })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("salary contribution validates identity-free context before pay details", async ({ page }) => {
    await page.goto("/salaries");
    await expect(page.getByText("Public comparisons are building.")).toBeVisible();
    await page.getByRole("button", { name: "Share without a reward" }).click();
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
    await expect(page.getByRole("heading", { name: /Share your salary. Earn ₦1,000./i })).toBeVisible();
    await expect(page.getByText(/Anonymous in public benchmarks/i)).toBeVisible();
    await page.getByRole("button", { name: "Check eligibility" }).click();
    await expect(page.getByText(/One paid report per person/i)).toBeVisible();
    await expect(page.getByText(/benchmark needs five similar approved reports/i)).toBeVisible();
  });

  test("empty calculator submission reports the problem without a zero result", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Calculate take-home pay" }).click();
    await expect(page.getByText("Enter your salary before calculating.")).toBeVisible();
    await expect(page.getByLabel("Salary before deductions")).toBeFocused();
    await expect(page.getByText("₦0")).toHaveCount(0);
  });
});
