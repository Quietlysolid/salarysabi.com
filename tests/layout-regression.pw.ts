import { expect, test } from "@playwright/test";

test("public pages expose one main landmark inside the shared shell", async ({ page }) => {
  for (const route of ["/", "/salaries", "/salaries-and-jobs", "/business", "/tax-tools", "/contributors", "/contributors/job-sourcing", "/privacy", "/disclaimer"]) {
    await page.goto(route);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("main main")).toHaveCount(0);
    await expect(page.locator(".site-header")).toBeVisible();
    await expect(page.locator(".info-footer")).toBeVisible();
  }
});

test("primary navigation uses four clear task destinations", async ({ page }) => {
  await page.goto("/");
  const mobile = (page.viewportSize()?.width ?? 0) <= 760;
  const nav = page.getByRole("navigation", { name: mobile ? "Mobile navigation" : "Primary navigation" });
  if (!mobile) await expect(nav.getByRole("link")).toHaveCount(4);
  await expect(nav.getByRole("link", { name: "Pay & tax" })).toHaveAttribute("aria-current", "page");
  await page.goto("/business");
  if (mobile) await nav.getByText("More").click();
  await expect(nav.getByRole("link", { name: "For employers" })).toHaveAttribute("aria-current", "page");
  await page.goto("/paye-guide");
  if (mobile) await nav.getByText("More").click();
  await expect(nav.getByRole("link", { name: "Learn" })).toHaveAttribute("aria-current", "page");
});

test("calculator requires salary before showing a result", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Calculate take-home pay" }).click();
  await expect(page.getByText("Enter your salary before calculating.")).toBeVisible();
  await expect(page.getByLabel("Salary before deductions")).toBeFocused();
  await expect(page.locator(".result-summary")).toHaveCount(0);
});

test("calculator result prioritises trust, action and portable records", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Salary before deductions").fill("750000");
  await page.getByRole("button", { name: "Calculate take-home pay" }).click();
  await expect(page.locator("#results")).toBeFocused();
  await expect(page.locator(".calculation-trust")).toContainText("Official 2026 rules");
  await expect(page.getByRole("heading", { name: "What to do next" })).toBeVisible();
  await expect(page.locator(".result-next-actions li")).toHaveCount(3);
  await page.getByText("View full calculation").click();
  await expect(page.getByRole("button", { name: "PDF" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Excel" })).toBeVisible();
});

test("mobile keeps descriptions and avoids horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/salaries-and-jobs");
  await expect(page.getByText(/See reviewed ranges for similar roles/i)).toBeVisible();
  await expect(page.getByText(/See the offered salary and source before you apply/i)).toBeVisible();
  await expect(page.getByText(/Save jobs and keep your application progress/i)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("salary empty state explains the privacy threshold and offers immediate value", async ({ page }) => {
  await page.goto("/salaries");
  await expect(page.getByText("Public comparisons are building.")).toBeVisible();
  await expect(page.getByText(/five similar reports are approved/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse jobs with published pay" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Check your take-home pay" })).toBeVisible();
});

test("contributor reward copy distinguishes public anonymity from private processing", async ({ page }) => {
  await page.goto("/contributors");
  await expect(page.getByText(/individual salary stays out of public view/i)).toBeVisible();
  await page.getByRole("button", { name: "Check salary-report eligibility" }).click();
  await expect(page.getByText(/individual salary is never published/i)).toBeVisible();
  await expect(page.getByText(/benchmark needs five similar approved reports/i)).toBeVisible();
});

test("privacy and disclaimer pages give short, scannable reading paths", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.locator(".privacy-trust > div")).toHaveCount(3);
  await expect(page.locator(".privacy-ledger-row")).toHaveCount(11);
  await page.goto("/disclaimer");
  await expect(page.locator(".disclaimer-summary-grid > p")).toHaveCount(4);
  await expect(page.getByRole("navigation", { name: "Disclaimer next steps" })).toBeVisible();
});

test("PAYE guide offers four question-led routes", async ({ page }) => {
  await page.goto("/paye-guide");
  await expect(page.getByRole("heading", { name: "Understand your PAYE" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "PAYE guide topics" }).getByRole("link")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "How PAYE is calculated" })).toHaveAttribute("href", "/how-paye-is-calculated");
});

test("jobs and business hubs retain clear audience routes", async ({ page }) => {
  await page.goto("/jobs");
  await expect(page.getByRole("heading", { name: "Jobs with salaries" })).toBeVisible();
  await page.goto("/business");
  await expect(page.getByRole("link", { name: /Run payroll/i })).toHaveAttribute("href", "/payroll");
  await expect(page.getByRole("link", { name: /Plan company tax/i })).toHaveAttribute("href", "/company-tax");
  await expect(page.locator('.product-hub-paths a[href="/post-a-job"]')).toHaveAttribute("href", "/post-a-job");
});
