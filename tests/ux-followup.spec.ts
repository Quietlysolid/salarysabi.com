import { expect, test } from "@playwright/test";

test("recruiter draft survives sign-in detour, Back and reload; discard clears it", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/post-a-job");
  await page.getByLabel("Posting as").selectOption("recruiter");
  await page.locator('[name="recruiter_company"]').fill("Example agency");
  await page.locator('[name="client_display_name"]').fill("Confidential employer");
  await page.locator('[name="authority_confirmed"]').check();
  await page.locator('[name="title"]').fill("Support specialist");
  await page.locator('[name="company_name"]').fill("Example company");
  await page.locator('[name="location"]').fill("Lagos");
  await page.getByRole("button", { name: "Next: Salary details" }).click();
  await page.locator('[name="salary_min"]').fill("350000");
  await page.locator('[name="salary_max"]').fill("450000");
  await page.getByRole("button", { name: "Next: Application details" }).click();
  await page.locator('[name="contact_email"]').fill("draft@example.com");
  await page.getByRole("link", { name: "Sign in to track your listing" }).click();
  await expect(page).toHaveURL(/\/hiring\?from=post-a-job$/, { timeout: 15000 });
  await expect(page.getByRole("link", { name: "Return to your job draft" })).toBeVisible();
  await page.goBack();
  await expect(page.locator('[data-step="3"]')).toBeVisible();
  await expect(page.locator('[name="contact_email"]')).toHaveValue("draft@example.com");
  await expect(page.locator(".job-review")).toContainText("Support specialist");
  await page.reload();
  await expect(page.locator('[data-step="3"]')).toBeVisible();
  await expect(page.locator('[name="authority_confirmed"]')).toBeChecked();
  await expect(page.locator('[name="recruiter_company"]')).toHaveValue("Example agency");
  await expect(page.locator('[name="salary_max"]')).toHaveValue("450000");
  await page.getByRole("link", { name: "Sign in to track your listing" }).click();
  await page.getByRole("link", { name: "Return to your job draft" }).click();
  await expect(page.locator('[data-step="3"]')).toBeVisible();
  await page.getByRole("button", { name: "Discard draft" }).click();
  await expect(page.locator('[name="title"]')).toHaveValue("");
  await page.reload();
  await expect(page.locator('[data-step="1"]')).toBeVisible();
  await expect(page.locator('[name="title"]')).toHaveValue("");
  await expect(page.getByLabel("Posting as")).toHaveValue("employer");
});

test("blocked draft storage does not prevent entering a job", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error("Storage blocked"); };
  });
  await page.goto("/post-a-job");
  await page.locator('[name="title"]').fill("Support specialist");
  await page.locator('[name="company_name"]').fill("Example company");
  await page.locator('[name="location"]').fill("Lagos");
  await expect(page.locator(".wizard-draft-note")).toContainText("could not be saved");
  await page.getByRole("button", { name: "Next: Salary details" }).click();
  await expect(page.locator('[data-step="2"]')).toBeVisible();
});

test("entry links disclose empty inventory but never treat errors as empty", async ({ page }) => {
  await page.route("**/api/jobs?*", route => route.fulfill({ json: { data: [], pagination: { page: 1, totalPages: 1 } } }));
  await page.route("**/rest/v1/rpc/public_recent_salary_benchmarks", route => route.fulfill({ json: [] }));
  await page.goto("/");
  await expect(page.getByText("No published jobs right now.", { exact: true })).toBeVisible();
  await expect(page.getByText("No salary comparisons published yet.", { exact: true })).toBeVisible();
  await page.route("**/api/jobs?*", route => route.fulfill({ status: 503, body: "Unavailable" }));
  await page.route("**/rest/v1/rpc/public_recent_salary_benchmarks", route => route.fulfill({ status: 503, body: "Unavailable" }));
  const failedJobs = page.waitForResponse(response => response.url().includes("/api/jobs?") && response.status() === 503);
  const failedSalaries = page.waitForResponse(response => response.url().includes("public_recent_salary_benchmarks") && response.status() === 503);
  await page.reload();
  await Promise.all([failedJobs, failedSalaries]);
  await expect(page.locator(".discovery-availability")).toHaveCount(0);
  await page.route("**/api/jobs?*", route => route.fulfill({ json: { data: [{ id: "available-job" }] } }));
  await page.route("**/rest/v1/rpc/public_recent_salary_benchmarks", route => route.fulfill({ json: [{ sample_size: 5 }] }));
  const availableJobs = page.waitForResponse(response => response.url().includes("/api/jobs?") && response.ok());
  const availableSalaries = page.waitForResponse(response => response.url().includes("public_recent_salary_benchmarks") && response.ok());
  await page.reload();
  await Promise.all([availableJobs, availableSalaries]);
  await expect(page.locator(".discovery-availability")).toHaveCount(0);
});

test("calculator explains deductions and marks examples without pre-filling them", async ({ page }) => {
  await page.goto("/calculator");
  await page.locator(".payslip-deductions summary").click();
  const nhf = page.getByLabel("NHF", { exact: true });
  await expect(nhf).toHaveValue("");
  await expect(nhf).toHaveAttribute("placeholder", "Example: 10,000");
  await expect(nhf).toHaveAccessibleDescription(/National Housing Fund/);
  await expect(page.getByLabel("Other deductions", { exact: true })).toHaveAccessibleDescription(/not taxable income/);
});

test("zero company-tax estimate explains the size classification beside the total", async ({ page }) => {
  await page.goto("/company-tax");
  await page.locator("#company-revenue").fill("12000000");
  await page.locator("#company-assets").fill("10000000");
  await page.getByRole("button", { name: "Estimate company tax" }).click();
  await expect(page.locator("#company-estimate")).toBeFocused();
  await expect(page.locator("#company-estimate > strong + p")).toContainText("both small-company size limits");
});
