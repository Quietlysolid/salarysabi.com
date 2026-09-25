import { test, expect } from "@playwright/test";
test("calculator carries entered figures into payslip checking", async ({ page }) => {
  await page.goto("/calculator");
  await page.getByLabel("Monthly gross", { exact: false }).fill("200000");
  await page.getByRole("button", { name: "Calculate take-home pay", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your estimated take-home" })).toBeVisible();
  await page.getByRole("button", { name: "Check my payslip with these figures" }).click();
  await expect(page.getByRole("heading", { name: "Check your payslip." })).toBeVisible();
  await expect(page.getByLabel("Monthly gross", { exact: false })).toHaveValue("200,000");
  await expect(page.getByLabel("PAYE deducted", { exact: false })).toHaveValue("");
  expect(page.url()).not.toContain("200000");
});
test("missing job context falls back to manual input", async ({ page }) => {
  await page.goto("/calculator?job=salarysabi-does-not-exist");
  await expect(page.getByText(/We could not carry this listing/)).toBeVisible();
  await expect(page.getByLabel("Monthly gross", { exact: false })).toHaveValue("");
});
