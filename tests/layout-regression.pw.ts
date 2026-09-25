import { expect, test } from "@playwright/test";

test("public pages expose one main landmark inside the shared shell", async ({ page }) => {
  test.setTimeout(90_000);
  for (const route of ["/individuals", "/employers", "/salaries-and-jobs", "/business", "/tax-tools", "/privacy", "/disclaimer"]) {
    await page.goto(route);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("main main")).toHaveCount(0);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.locator(".info-footer")).toBeVisible();
  }
});

test("global and audience navigation stay distinct", async ({ page }) => {
  await page.goto("/salaries-and-jobs");
  const mobile = (page.viewportSize()?.width ?? 0) <= 760;
  const nav = page.getByRole("navigation", { name: mobile ? "Mobile navigation" : "Primary navigation" });
  if (!mobile) await expect(nav.getByRole("link")).toHaveCount(2);
  if (!mobile) await expect(page.getByRole("navigation", { name: "For individuals tools" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "For individuals" })).toHaveAttribute("aria-current", "page");
  await page.goto("/business");
  if (!mobile) await expect(page.getByRole("navigation", { name: "For employers tools" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "For employers" })).toHaveAttribute("aria-current", "page");
  await page.goto("/privacy");
  await expect(page.locator(".audience-navigation")).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Learn" })).toHaveCount(0);
});

test("root prioritizes take-home pay", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "How do you want to use SalarySabi?" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Salary na promise. Take-home na reality." })).toBeVisible();
  await expect(page.locator(".gateway-path-list, .gateway-directory")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Calculate my pay", exact: true })).toHaveAttribute("href", "#home-gross");
  await expect(page.locator('a[href="/contributors"]')).toHaveCount(0);
  await expect(page.locator(".info-footer")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("audience homepages route every visible task to the correct tool", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/individuals");
  for (const [name, href] of [["Calculate my take-home", "/calculator"], ["Check my payslip", "/calculator?mode=check"], ["Find jobs with salaries", "/jobs"], ["Compare and share salaries", "/salaries"]]) {
    await expect(page.getByRole("main").getByRole("link", { name })).toHaveAttribute("href", href);
  }
  await page.goto("/employers");
  for (const [name, href] of [["Run payroll", "/payroll"], ["Estimate company tax", "/company-tax"], ["Post a job", "/post-a-job"], ["Manage my listings", "/hiring"]]) {
    await expect(page.getByRole("main").getByRole("link", { name })).toHaveAttribute("href", href);
  }
});

test("mobile homepage offers a direct route to take-home pay", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Salary na promise. Take-home na reality." })).toBeVisible();
  await page.getByRole("link", { name: "Calculate my pay", exact: true }).click();
  await expect(page.locator("#home-gross")).toBeFocused();
  await page.locator("#home-gross").fill("500000");
  await page.getByRole("link", { name: "Add deductions & reliefs" }).click();
  await expect(page).toHaveURL(/\/calculator\?from=home$/);
  await expect(page.getByLabel("Monthly gross pay")).toHaveValue("500,000");
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

test("mobile wordmarks keep a clear seam between the mark and text", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 914 });
  await page.goto("/payslip-checker");
  await expect(page.locator(".audience-navigation-home")).toHaveText("For individuals");

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

test("privacy and terms keep essential information visible", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.locator(".terms-at-a-glance li")).toHaveCount(3);
  await expect(page.locator(".privacy-feature-list details")).toHaveCount(10);
  for (const id of ["choices", "retention", "providers", "contact"]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
    await expect(page.locator(`details #${id}`)).toHaveCount(0);
  }
  await page.getByText("Calculator and payslip checks", { exact: true }).click();
  await expect(page.getByText(/The homepage preview saves the salary in session storage/)).toBeVisible();
  await page.goto("/disclaimer");
  await expect(page).toHaveURL(/\/terms#estimates$/);
  await expect(page.locator("#estimates")).toBeVisible();
});

test("pay experiences explain the numbers live", async ({ page }) => {
  await page.goto("/calculator?mode=check");
  await expect(page.locator(".payslip-live-result")).toHaveCount(0);
  await page.getByLabel("Gross pay").fill("500000");
  await expect(page.locator(".payslip-live-result")).toHaveCount(0);
  await page.getByLabel("PAYE deducted").fill("45000");
  await page.getByLabel("Pension deducted").fill("0");
  await page.getByRole("button", { name: "Check my PAYE" }).click();
  await expect(page.getByRole("heading", { name: "Your PAYE differs from our estimate." })).toBeVisible();
  await expect(page.locator(".payslip-live-result")).toContainText("27,500.00 lower");
  await expect(page.locator(".payslip-result-comparison")).toContainText("₦72,500");
  await expect(page.locator(".payslip-result-equation")).toContainText("₦427,500");
  await expect(page.locator(".payslip-live-status")).toContainText("ask payroll to explain the difference");
  await page.getByText("View calculation breakdown", { exact: true }).click();
  await expect(page.locator(".pay-check-breakdown")).toContainText("Take-home from your payslip figures");
  await page.getByText("Questions to ask payroll", { exact: true }).click();
  await expect(page.locator(".pay-check-payroll li")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Copy questions for payroll" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Your Pay Check next actions" }).getByRole("link")).toHaveCount(2);

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

  await expect(page.getByRole("heading", { name: "Better pay decisions. Every step of the way." })).toBeVisible();
  await expect(page.locator(".about-audiences section")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "For individuals", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "For employers", exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Explore tools for individuals" })).toHaveAttribute("href", "/individuals");
  await expect(page.getByRole("main").getByRole("link", { name: "Explore employer tools" })).toHaveAttribute("href", "/employers");
  await expect(page.getByRole("link", { name: "How our calculations work" })).toHaveAttribute("href", "/how-paye-is-calculated");
  await expect(page.getByRole("heading", { name: "Meet the team." })).toBeVisible();
  for (const name of ["Ozichi Nwosu", "Victoria Green", "Veno Green", "Udy Nwosu"]) await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
