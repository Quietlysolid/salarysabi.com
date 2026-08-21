import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = "http://localhost:3000";
const outputDir = path.resolve("design-audit/holistic-implementation-20260821");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const desktop = await browser.newContext({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const summary = [];

async function capture(context, name, route, setup) {
  const page = await context.newPage();
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  if (setup) await setup(page);
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true });
  summary.push(await page.evaluate(({ name, route }) => ({
    name,
    route,
    title: document.title,
    h1: [...document.querySelectorAll("h1")].map((node) => node.textContent?.trim()),
    mains: document.querySelectorAll("main").length,
    duplicateMainIds: document.querySelectorAll("#main-content").length,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }), { name, route }));
  await page.close();
}

const desktopRoutes = [
  ["01-home-initial", "/"],
  ["03-jobs-salaries-hub", "/salaries-and-jobs"],
  ["04-salary-comparison", "/salaries"],
  ["05-jobs", "/jobs"],
  ["06-payslip", "/payslip-checker"],
  ["07-employers", "/business"],
  ["08-payroll", "/payroll"],
  ["09-paye-guide", "/paye-guide"],
  ["10-contributors", "/contributors"],
  ["11-about", "/about"],
];

for (const [name, route] of desktopRoutes) await capture(desktop, name, route);
await capture(desktop, "02-home-result", "/", async (page) => {
  await page.getByLabel("Salary before deductions").fill("750000");
  await page.getByRole("button", { name: "Calculate take-home pay" }).click();
  await page.waitForTimeout(350);
});

for (const [name, route] of [
  ["12-mobile-home-initial", "/"],
  ["14-mobile-jobs-salaries", "/salaries-and-jobs"],
  ["15-mobile-payslip", "/payslip-checker"],
  ["16-mobile-contributors", "/contributors"],
]) await capture(mobile, name, route);
await capture(mobile, "13-mobile-home-result", "/", async (page) => {
  await page.getByLabel("Salary before deductions").fill("750000");
  await page.getByRole("button", { name: "Calculate take-home pay" }).click();
  await page.waitForTimeout(350);
});

await writeFile(path.join(outputDir, "route-summary.json"), JSON.stringify(summary, null, 2));
await desktop.close();
await mobile.close();
await browser.close();
