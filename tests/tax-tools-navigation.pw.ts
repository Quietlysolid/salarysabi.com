import { expect, test } from "@playwright/test";

const tools = [
  ["Salary or wages", "/payslip-checker"],
  ["Freelance or creator income", "/freelancer-tax"],
  ["Foreign income", "/foreign-income-tax"],
  ["Company tax", "/company-tax"],
  ["Investment income", "/investment-tax"],
] as const;

for (const [name, destination] of tools) {
  test(`${name} tax-tool card opens its calculator`, async ({ page }) => {
    await page.goto("/tax-tools");
    const card = page.locator(".tool-index > div > a", { hasText: name });

    await expect(card).toHaveAttribute("href", destination);
    const [pathname, hash = ""] = destination.split("#");
    const destinationPattern = new RegExp(`${pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:#${hash})?$`);
    await card.scrollIntoViewIfNeeded();
    await Promise.all([
      page.waitForURL(destinationPattern, { timeout: 10_000 }),
      card.click({ position: { x: 40, y: 40 } }),
    ]);
  });
}

const payeGuides = [
  ["How is PAYE calculated?", "/how-paye-is-calculated"],
  ["What deductions can I enter?", "/eligible-deductions"],
  ["Which tax rate applies to me?", "/tax-bands"],
] as const;

for (const [name, destination] of payeGuides) {
  test(`${name} guide card opens from its card body`, async ({ page }) => {
    await page.goto("/paye-guide");
    const card = page.locator(`.paye-guide-question-list a[href="${destination}"]`, { hasText: name });

    await expect(card).toHaveAttribute("href", destination);
    await card.scrollIntoViewIfNeeded();
    await Promise.all([
      page.waitForURL(new RegExp(`${destination}$`), { timeout: 10_000 }),
      card.click({ position: { x: 40, y: 40 } }),
    ]);
  });
}
