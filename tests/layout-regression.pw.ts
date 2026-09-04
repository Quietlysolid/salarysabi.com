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
  await expect(page.getByRole("heading", { name: "Pay should be clear." })).toBeVisible();
  await expect(page.locator(".gateway-path-list").getByText("For talent")).toBeVisible();
  await expect(page.locator(".gateway-path-list").getByText("For employers")).toBeVisible();
  await expect(page.getByRole("link", { name: /Understand my pay/i })).toHaveAttribute("href", "/talent");
  await expect(page.getByRole("link", { name: "Run payroll" })).toHaveAttribute("href", "/payroll");
  if ((page.viewportSize()?.width ?? 0) <= 760) {
    await expect(page.locator('.mobile-nav a[href="/contributors"]')).toHaveAttribute("href", "/contributors");
  } else {
    await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Contribute" })).toHaveAttribute("href", "/contributors");
  }
  await expect(page.locator(".info-footer")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("audience homepages route every visible task to the correct tool", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/talent");
  const calculateLink = page.getByRole("link", { name: "Calculate my pay" });
  await expect(calculateLink).toHaveAttribute("href", "/payslip-checker");
  await expect(page.locator("#calculator")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Explore jobs" })).toHaveAttribute("href", "/jobs");
  await page.goto("/employers");
  const employerActions = page.locator(".employer-editorial-actions");
  await expect(employerActions.getByRole("link", { name: "Run payroll" })).toHaveAttribute("href", "/payroll");
  await expect(employerActions.getByRole("link", { name: "Plan company tax" })).toHaveAttribute("href", "/company-tax");
});

test("mobile audience gateway keeps both choices clear and focused", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pay should be clear." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pay & tax" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Employer tools" })).toBeVisible();
  await page.getByRole("link", { name: /Understand my pay/i }).click();
  await expect(page).toHaveURL(/\/talent$/);
  await expect(page.getByRole("heading", { name: /Everything about your pay in one place/i })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("mobile keeps descriptions and avoids horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/salaries-and-jobs");
  await expect(page.getByText(/See reviewed ranges for similar roles/i)).toHaveCount(0);
  await expect(page.getByText(/See the offered salary and source before you apply/i)).toHaveCount(0);
  await expect(page.getByText(/Save jobs and keep your application progress/i)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("mobile campaign announcement keeps its message readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/rest/v1/rpc/public_active_contribution_campaigns", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{
        contribution_type: "salary_report",
        reward_kobo: 100000,
        budget_remaining_kobo: 2000000,
      }]),
    });
  });
  await page.goto("/salaries");

  const announcement = page.getByLabel("Active funded contributor offer");
  await expect(announcement.getByText("Help make Nigerian pay clearer.")).toBeVisible();
  await expect(announcement.getByRole("link", { name: /See funded offers/ })).toBeVisible();
  const stacked = await announcement.evaluate((node) => {
    const message = node.querySelector("p")?.getBoundingClientRect();
    const action = node.querySelector("a")?.getBoundingClientRect();
    return Boolean(message && action && action.top >= message.bottom);
  });
  expect(stacked).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("mobile wordmarks keep a clear seam between the mark and text", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 914 });
  await page.goto("/contributors");
  await expect(page.locator(".audience-navigation-home")).toHaveText("Contribute");

  for (const selector of [".site-header .brand-wordmark", ".info-footer .brand-wordmark"]) {
    const wordmark = page.locator(selector);
    await wordmark.scrollIntoViewIfNeeded();
    expect(await wordmark.evaluate((node) => getComputedStyle(node).display)).toMatch(/^(inline-)?flex$/);

    const geometry = await wordmark.evaluate((node) => {
      const mark = node.querySelector(".brand-wordmark-mark");
      const text = node.querySelector(".brand-wordmark-text")?.getBoundingClientRect();
      const paths = Array.from(mark?.querySelectorAll("path") ?? []).map((path) => path.getBoundingClientRect());
      if (!mark || !text || paths.length === 0) return null;
      const markBounds = mark.getBoundingClientRect();
      const markCenter = markBounds.top + markBounds.height / 2;
      const textCenter = text.top + text.height / 2;
      return {
        aligned: Math.abs(markCenter - textCenter) < 8,
        seam: text.left - Math.max(...paths.map((path) => path.right)),
      };
    });
    expect(geometry).not.toBeNull();
    expect(geometry?.aligned).toBe(true);
    expect(geometry?.seam).toBeGreaterThanOrEqual(2);
    expect(geometry?.seam).toBeLessThanOrEqual(8);
  }
});

test("salary empty state explains the privacy threshold and offers immediate value", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/salaries");
  const emptyState = page.locator(".benchmark-empty");
  await expect(page.getByRole("heading", { name: "Know what your work is worth." })).toBeVisible();
  await expect(emptyState.getByText(/five similar, anonymous reports are approved/i)).toBeVisible();
  await expect(emptyState.getByRole("button", { name: "Share my salary" })).toBeVisible();
  await expect(emptyState.getByText("Your individual salary is never published.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse jobs with published pay" })).toBeVisible();
  await expect(emptyState.getByText("Check your take-home pay")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("contributor reward copy distinguishes public anonymity from private processing", async ({ page }) => {
  await page.goto("/contributors");
  await expect(page.getByText(/individual salary stays out of public view/i)).toBeVisible();
  await expect(page.locator(".contributor-outcome-primary")).toHaveAttribute("href", /\/salaries\?campaign=.*#salary-report/);
  await page.locator("#pilot-rules > summary").click();
  await expect(page.getByText(/individual salary is never published/i)).toBeVisible();
  await expect(page.getByText(/benchmark needs five similar approved reports/i)).toBeVisible();
  await expect(page.getByText(/Ends \d/i)).toHaveCount(0);
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
  await expect(page.getByRole("heading", { name: "See where your salary goes." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Understand the calculation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "PAYE guide topics" }).getByRole("link")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "How PAYE is calculated" })).toHaveAttribute("href", "/how-paye-is-calculated");
  await expect(page.getByRole("link", { name: "Check my payslip" })).toHaveCount(0);
});

test("pay experiences explain the numbers live", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".gateway-motion-step--3")).toBeVisible();
  await expect(page.getByText("PAYE calculated · Net pay confirmed")).toBeVisible();
  await expect(page.locator(".gateway-motion-step--2")).toHaveCSS("animation-name", "gateway-result-in");

  await page.goto("/payslip-checker");
  await expect(page.locator(".payslip-live-result")).toHaveCount(0);
  await page.getByLabel("Gross pay").fill("500000");
  await expect(page.locator(".payslip-live-result")).toHaveCount(0);
  await page.getByLabel("PAYE deducted").fill("45000");
  await page.getByLabel("Pension deducted").fill("0");
  await page.getByRole("button", { name: "Check my PAYE" }).click();
  await expect(page.locator(".pay-check-verdict")).toContainText("Likely discrepancy");
  await expect(page.getByRole("heading", { name: "Your PAYE is ₦27,500 lower." })).toBeVisible();
  await expect(page.locator(".payslip-result-comparison")).toContainText("₦72,500");
  await expect(page.locator(".payslip-result-equation")).toContainText("₦427,500");
  await expect(page.locator(".payslip-live-status")).toContainText("ask payroll to explain the difference");
  await expect(page.locator(".pay-check-breakdown")).toContainText("Take-home from entered figures");
  await expect(page.locator(".pay-check-payroll li")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Copy questions for payroll" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /whether your PAYE and pension deductions were actually remitted/i })).toBeVisible();
  await page.getByRole("button", { name: "Yes, help me track it" }).click();
  await expect(page.getByRole("status")).toContainText("without your pay figures");
  await expect(page.getByRole("navigation", { name: "Your Pay Check next actions" }).getByRole("link")).toHaveCount(3);

  await page.goto("/paye-guide");
  await expect(page.getByRole("checkbox", { name: /Include statutory employee pension/i })).toBeChecked();
  await page.getByRole("textbox", { name: "Monthly gross salary" }).fill("600000");
  await expect(page.locator(".paye-guide-live-result")).toContainText("₦48,000");
  await expect(page.locator(".paye-guide-live-result")).toContainText("₦81,860");
});

test("jobs and business hubs retain clear audience routes", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/jobs");
  await expect(page.getByRole("heading", { name: "A job should tell you what it pays." })).toBeVisible();
  if (await page.locator(".job-card").count() === 0) {
    await expect(page.getByText("New salary-transparent jobs are coming.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Share a job lead" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Hiring? Post a role" })).toBeVisible();
    await expect(page.getByText("0 jobs available")).toHaveCount(0);
    await expect(page.getByText("Use the salary before you apply")).toHaveCount(0);
    await expect(page.locator(".jobs-next-actions, .journey-next-steps")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }
  await page.goto("/business");
  await expect(page.locator('.product-hub-paths a[href="/payroll"]')).toHaveAttribute("href", "/payroll");
  await expect(page.locator('.product-hub-paths a[href="/company-tax"]')).toHaveAttribute("href", "/company-tax");
  await expect(page.locator('.product-hub-paths a[href="/post-a-job"]')).toHaveAttribute("href", "/post-a-job");
});

test("mobile about page gives both audiences equal paths and concise proof", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/about");

  await expect(page.getByRole("heading", { name: "Pay should be clear." })).toBeVisible();
  await expect(page.getByText(/helps people understand what they earn/i)).toHaveCount(0);
  await expect(page.getByText(/while helping employers calculate, explain and document/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Understand my pay/ })).toHaveAttribute("href", "/talent");
  await expect(page.getByRole("link", { name: /Manage my team's pay/ })).toHaveAttribute("href", "/employers");
  await expect(page.getByRole("heading", { name: "Both sides of pay." })).toBeVisible();
  await expect(page.locator(".about-audience-panel")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Know what reaches your bank." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pay people right. Prove it." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore talent tools/ })).toHaveAttribute("href", "/talent");
  await expect(page.getByRole("link", { name: /Explore employer tools/ })).toHaveAttribute("href", "/employers");
  await expect(page.getByRole("heading", { name: "Our numbers have receipts." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Inspect the rules/ })).toHaveAttribute("href", "/tax-updates");
  await expect(page.getByRole("heading", { name: "Meet the team." })).toBeVisible();
  await expect(page.getByText("Ozichi Nwosu")).toBeVisible();
  await expect(page.getByText("Victoria Green")).toBeVisible();
  await expect(page.getByText("Veno Green")).toBeVisible();
  await expect(page.getByText("Built in Nigeria.")).toHaveCount(0);
  await expect(page.getByText(/does not replace professional tax advice/i)).toHaveCount(0);
  await expect(page.getByText("What SalarySabi helps you do")).toHaveCount(0);
  await expect(page.getByText("Three answers that move you forward.")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
