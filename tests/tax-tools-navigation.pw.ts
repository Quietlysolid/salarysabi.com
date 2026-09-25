import { expect, test } from "@playwright/test";

const tools = [
  ["Salary or wages", "/calculator"],
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
    await card.click({ position: { x: 40, y: 40 } });
    await expect(page).toHaveURL(destinationPattern, { timeout: 30_000 });
  });
}
