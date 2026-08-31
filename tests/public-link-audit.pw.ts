import { expect, test } from "@playwright/test";

const publicPages = [
  "/", "/about", "/accessibility", "/account", "/business", "/calculation-notes",
  "/company-tax", "/contributors", "/creator-tax", "/disclaimer", "/eligible-deductions",
  "/foreign-income-tax", "/freelancer-tax", "/how-paye-is-calculated", "/investment-tax",
  "/jobs", "/paye-guide", "/payroll", "/payslip-checker", "/post-a-job", "/privacy",
  "/salaries", "/salaries-and-jobs", "/security", "/suggest-a-job", "/tax-bands",
  "/tax-news", "/tax-news/nigeria-tax-act-2025-paycheck-2026", "/tax-tools", "/tax-updates",
  "/terms",
];

test("every unique public internal link completes a browser navigation", async ({ page, request }) => {
  test.setTimeout(240_000);
  const links = new Map<string, string>();

  for (const source of publicPages) {
    if (source === "/") await page.context().clearCookies();
    await page.goto(source, { waitUntil: "domcontentloaded" });
    for (const href of await page.locator('a[href]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href") || ""))) {
      if (!href.startsWith("/") || href.startsWith("//")) continue;
      if (!links.has(href)) links.set(href, source);
    }
  }

  expect(links.size).toBeGreaterThan(30);
  console.log(`Auditing ${links.size} unique internal destinations across ${publicPages.length} public pages`);

  for (const [href, source] of links) {
    const response = await request.get(href.split("#")[0]);
    expect(response.status(), `${source} links to ${href}`).toBeLessThan(400);

    if (source === "/") await page.context().clearCookies();
    await page.goto(source, { waitUntil: "domcontentloaded" });
    const link = page.locator(`a[href="${href.replaceAll('"', '\\"')}"]`).first();
    await expect(link, `${source} should render ${href}`).toBeAttached();
    await link.evaluate((node: HTMLAnchorElement) => node.click());
    await expect(page, `${source} click should navigate to ${href}`).toHaveURL(
      new RegExp(`${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
      { timeout: 10_000 },
    );
  }
});
