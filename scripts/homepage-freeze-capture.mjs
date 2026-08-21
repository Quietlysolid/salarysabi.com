import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("design-audit/homepage-freeze-audit-20260821");
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function stablePage(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("https://salarysabi.com", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  return { context, page };
}

{
  const { context, page } = await stablePage({ width: 1440, height: 1100 });
  await page.screenshot({ path: resolve(output, "01-desktop-initial.png"), fullPage: true });
  await page.getByLabel("Salary before deductions").fill("750000");
  await page.getByRole("button", { name: "Calculate take-home pay" }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(output, "02-desktop-result.png"), fullPage: true });
  await context.close();
}

{
  const { context, page } = await stablePage({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(output, "03-mobile-initial.png"), fullPage: true });
  await page.getByText("Menu", { exact: true }).click();
  await page.screenshot({ path: resolve(output, "04-mobile-menu.png"), fullPage: false });
  await page.getByText("Menu", { exact: true }).click();
  await page.getByLabel("Salary before deductions").fill("750000");
  await page.getByRole("button", { name: "Calculate take-home pay" }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(output, "05-mobile-result.png"), fullPage: true });
  await context.close();
}

await browser.close();
