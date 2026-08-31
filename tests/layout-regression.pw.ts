import { expect, test } from "@playwright/test";

test("public pages expose one main landmark inside the shared shell", async ({ page }) => {
  test.setTimeout(90_000);
  for (const route of ["/talent", "/employers", "/salaries", "/salaries-and-jobs", "/business", "/tax-tools", "/contributors", "/contributors/job-sourcing", "/privacy", "/disclaimer"]) {
    await page.goto(route);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("main main")).toHaveCount(0);
    await expect(page.locator(".site-header")).toBeVisible();
    await expect(page.locator(".info-footer")).toBeVisible();
  }
});

test("global and audience navigation stay distinct", async ({ page }) => {
  await page.goto("/salaries-and-jobs");
  const mobile = (page.viewportSize()?.width ?? 0) <= 760;
  const nav = page.getByRole("navigation", { name: mobile ? "Mobile navigation" : "Primary navigation" });
  if (!mobile) await expect(nav.getByRole("link")).toHaveCount(4);
  if (!mobile) await expect(page.getByRole("navigation", { name: "For talent tools" })).toBeVisible();
  await expect(nav.getByRole("link", { name: mobile ? "Talent" : "For talent" })).toHaveAttribute("aria-current", "page");
  await page.goto("/business");
  if (!mobile) await expect(page.getByRole("navigation", { name: "For employers tools" })).toBeVisible();
  await expect(nav.getByRole("link", { name: mobile ? "Employers" : "For employers" })).toHaveAttribute("aria-current", "page");
  await page.goto("/paye-guide");
  if (!mobile) await expect(page.getByRole("navigation", { name: "SalarySabi knowledge tools" })).toBeVisible();
  if (!mobile) await expect(nav.getByRole("link", { name: "Learn" })).toHaveAttribute("aria-current", "page");
});

test("root is a clear audience gateway", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "How do you want to use SalarySabi?" })).toHaveCount(0);
  await expect(page.locator(".gateway-choice--talent .gateway-choice-eyebrow")).toHaveText("For talent");
  await expect(page.locator(".gateway-choice--employer .gateway-choice-eyebrow")).toHaveText("For employers");
  await expect(page.getByRole("link", { name: /Understand my pay/i })).toHaveAttribute("href", "/talent");
  await expect(page.getByRole("link", { name: /Pay and hire my team/i })).toHaveAttribute("href", "/employers");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  if ((page.viewportSize()?.width ?? 0) > 820) {
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight)).toBe(true);
  }
});

test("audience homepages route every visible task to the correct tool", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/talent");
  const calculateLink = page.getByRole("link", { name: "Start with my pay" });
  await expect(calculateLink).toHaveAttribute("href", "/payslip-checker");
  await expect(page.locator("#calculator")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "See jobs with pay" })).toHaveAttribute("href", "/jobs");
  await page.goto("/employers");
  const employerActions = page.locator(".employer-editorial-actions");
  await expect(employerActions.getByRole("link", { name: "Run payroll" })).toHaveAttribute("href", "/payroll");
  await expect(employerActions.getByRole("link", { name: "Plan company tax" })).toHaveAttribute("href", "/company-tax");
});

test("mobile audience gateway keeps both choices clear and focused", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Know your actual salary." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pay people right and be able to prove it." })).toBeVisible();
  await page.getByRole("link", { name: /Understand my pay/i }).click();
  await expect(page).toHaveURL(/\/talent$/);
  await expect(page.getByRole("heading", { name: /Everything about your pay in one place/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Hire like you/i })).toHaveCount(0);
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
  await expect(page.locator('.product-hub-paths a[href="/payroll"]')).toHaveAttribute("href", "/payroll");
  await expect(page.locator('.product-hub-paths a[href="/company-tax"]')).toHaveAttribute("href", "/company-tax");
  await expect(page.locator('.product-hub-paths a[href="/post-a-job"]')).toHaveAttribute("href", "/post-a-job");
});
