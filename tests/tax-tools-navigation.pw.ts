import { expect, test } from "@playwright/test";

const tools = [
  ["Employee PAYE", "/#calculator"],
  ["Freelancer", "/freelancer-tax"],
  ["Creator", "/creator-tax"],
  ["Foreign income", "/foreign-income-tax"],
  ["Company", "/company-tax"],
  ["Investment", "/investment-tax"],
] as const;

for (const [name, destination] of tools) {
  test(`${name} tax-tool card opens its calculator`, async ({ page }) => {
    await page.goto("/tax-tools");
    const card = page.locator(".tool-index > div > a", { hasText: name });

    await expect(card).toHaveAttribute("href", destination);
    await card.click({ position: { x: 40, y: 40 } });

    const [pathname, hash = ""] = destination.split("#");
    await expect(page).toHaveURL(new RegExp(`${pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:#${hash})?$`));
  });
}

const payeGuides = [
  ["How PAYE is calculated", "/how-paye-is-calculated"],
  ["Eligible deductions", "/eligible-deductions"],
  ["Nigeria's 2026 tax bands", "/tax-bands"],
] as const;

for (const [name, destination] of payeGuides) {
  test(`${name} guide card opens from its card body`, async ({ page }) => {
    await page.goto("/paye-guide");
    const card = page.locator(".paye-guide-card", { hasText: name });

    await expect(card).toHaveAttribute("href", destination);
    await card.click({ position: { x: 40, y: 40 } });
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
  });
}
