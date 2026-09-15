import { expect, test } from "@playwright/test";

test.setTimeout(90_000);
test.beforeEach(async ({ page }) => {
  await page.route("https://pagead2.googlesyndication.com/**", route => route.abort());
});

test("offer checker explains rent, solves target pay and rejects invalid inputs", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/offer-checker", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Your offer, in real money." })).toHaveCSS("color", "rgb(255, 255, 255)");
  await page.getByLabel("Annual rent attributable to 2026").fill("1800000");
  await expect(page.getByTestId("offer-take-home")).toHaveText("₦513,260");
  await expect(page.getByTestId("offer-after-rent")).toHaveText("₦363,260");
  const required = await page.getByTestId("offer-required-gross").innerText();
  const gross = Number(required.replace(/[^0-9]/g, ""));
  expect(gross).toBeGreaterThan(650_000);
  await page.getByLabel("Monthly gross offer").fill(String(gross));
  const takeHome = Number((await page.getByTestId("offer-take-home").innerText()).replace(/[^0-9]/g, ""));
  expect(takeHome).toBeGreaterThanOrEqual(600_000);
  expect(takeHome).toBeLessThan(600_002);
  await page.getByLabel("Monthly pensionable pay").fill(String(gross + 1));
  await expect(page.getByRole("status")).toContainText("Pensionable pay must not exceed gross");
  await expect(page.getByTestId("offer-take-home")).toHaveCount(0);
  await page.getByLabel("Include employee pension").uncheck();
  await expect(page.getByTestId("offer-take-home")).toBeVisible();
  await page.getByLabel("Monthly gross offer").fill("-1");
  await expect(page.getByTestId("offer-take-home")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("salary answer renders a canonical estimate and prefills its calculator", async ({ page }) => {
  await page.goto("/salary-after-tax/750000", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle("₦750,000 Salary After Tax in Nigeria (2026) | SalarySabi");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/salary-after-tax\/750000$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("₦750,000 salary after tax in Nigeria");
  await expect(page.getByLabel("Monthly gross salary")).toHaveValue("750,000");
  await expect(page.locator(".salary-answer-breakdown > div").last().locator("dd")).toHaveText("₦583,300");
  const response = await page.goto("/salary-after-tax/123456");
  expect(response?.status()).toBe(404);
});

test("salary decisions fit a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/offer-checker", "/salary-after-tax/2000000"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), path).toBe(false);
  }
});
