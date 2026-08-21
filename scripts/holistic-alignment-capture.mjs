import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("design-audit/holistic-alignment-20260821");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

const desktopRoutes = [
  ["01-salaries-jobs-hub", "/salaries-and-jobs"],
  ["02-salary-benchmarks", "/salaries"],
  ["03-jobs", "/jobs"],
  ["04-payslip", "/payslip-checker"],
  ["05-business", "/business"],
  ["06-payroll", "/payroll"],
  ["07-paye-guide", "/paye-guide"],
  ["08-contributors", "/contributors"],
  ["09-about", "/about"],
];

const mobileRoutes = [
  ["10-mobile-salaries-jobs", "/salaries-and-jobs"],
  ["11-mobile-business", "/business"],
  ["12-mobile-contributors", "/contributors"],
  ["13-mobile-paye-guide", "/paye-guide"],
];

const summaries = [];
async function capture(name, path, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(`https://salarysabi.com${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  summaries.push(await page.evaluate(({ name, path }) => ({
    name,
    path,
    title: document.title,
    h1: [...document.querySelectorAll("h1")].map((item) => item.textContent?.trim()),
    mainLinks: [...document.querySelectorAll("main a")].map((item) => item.textContent?.trim()).filter(Boolean),
    primaryNav: [...document.querySelectorAll('[aria-label="Primary navigation"] a, [aria-label="Mobile navigation"] a')].map((item) => item.textContent?.trim()).filter(Boolean),
    mains: document.querySelectorAll("main").length,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }), { name, path }));
  await page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true });
  await context.close();
}

for (const [name, path] of desktopRoutes) await capture(name, path, { width: 1440, height: 1100 });
for (const [name, path] of mobileRoutes) await capture(name, path, { width: 390, height: 844 });
await writeFile(resolve(output, "route-summary.json"), JSON.stringify(summaries, null, 2));
await browser.close();
