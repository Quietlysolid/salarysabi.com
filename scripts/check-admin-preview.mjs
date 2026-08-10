import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://localhost:3000/admin?fixture=1", { waitUntil: "networkidle" });
await page.screenshot({ path: "design-audit/admin-current-2026-08-08/03-admin-review-final.png" });
for (const label of ["Published", "Reports", "Analytics", "Review"]) {
  await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
  await page.waitForTimeout(150);
}
await page.getByRole("button", { name: /Financial Controller/ }).click();
await page.locator(".admin-review-canvas").getByLabel("Minimum salary").fill("900000");
await page.getByRole("button", { name: "Save draft" }).focus();
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
mobile.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
mobile.on("pageerror", (error) => errors.push(error.message));
await mobile.goto("http://localhost:3000/admin?fixture=1", { waitUntil: "networkidle" });
await mobile.screenshot({ path: "design-audit/admin-current-2026-08-08/04-admin-review-mobile.png", fullPage: true });
console.log(JSON.stringify({ errors, desktopTitle: await page.locator("h1").first().textContent(), mobileWidth: await mobile.locator("body").evaluate((element) => element.scrollWidth) }));
await browser.close();
