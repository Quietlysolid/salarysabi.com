import { expect, test } from "@playwright/test";

test("job salary preview and review stay valid while editing", async ({ page }) => {
  await page.goto("/post-a-job");
  await page.getByLabel("Job title", { exact: true }).fill("Support specialist");
  await page.getByLabel("Company name", { exact: true }).fill("Walkthrough test company");
  await page.getByLabel("Location", { exact: true }).fill("Lagos, Nigeria");
  await page.getByRole("button", { name: "Next: Salary details" }).click();
  await expect(page.locator(".salary-preview")).not.toContainText("Not set");
  await page.locator('[name="salary_min"]').fill("400000");
  await page.locator('[name="salary_max"]').fill("300000");
  await expect(page.locator(".salary-preview")).toContainText("Enter a valid");
  await page.getByRole("button", { name: "Next: Application details" }).click();
  await expect(page.locator(".wizard-error-summary")).toBeVisible();
  await page.locator('[name="salary_max"]').fill("500000");
  await page.getByRole("button", { name: "Next: Application details" }).click();
  const review = page.getByRole("region", { name: "Review your listing" });
  await expect(review).toContainText("Support specialist");
  await expect(review).toContainText("Walkthrough test company");
  await expect(review).toContainText("₦400,000–₦500,000 per month");
  await page.getByLabel("Contact email").fill("ux@example.com");
  await page.getByRole("button", { name: "Edit salary" }).click();
  await page.locator('[name="salary_max"]').fill("600000");
  await page.getByRole("button", { name: "Next: Application details" }).click();
  await expect(review).toContainText("₦400,000–₦600,000 per month");
  await expect(page.getByLabel("Contact email")).toHaveValue("ux@example.com");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("hiring signup and recovery stay in hiring without sending mail", async ({ page }) => {
  const requests: string[] = [];
  await page.route("**/auth/v1/signup*", async route => {
    requests.push(route.request().url());
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ user: { id: "test-user", email: "ux@example.com" }, session: null }) });
  });
  await page.route("**/auth/v1/recover*", async route => {
    requests.push(route.request().url());
    await route.fulfill({ contentType: "application/json", body: "{}" });
  });
  await page.goto("/hiring");
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create your SalarySabi account" })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("ux@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Test-only-password-123!");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByLabel("Email", { exact: true }).fill("ux@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If an account exists");
  expect(new URL(requests[0]).searchParams.get("redirect_to")).toBe("http://localhost:3000/hiring");
  expect(new URL(requests[1]).searchParams.get("redirect_to")).toBe("http://localhost:3000/hiring?recovery=1");
  await expect(page).toHaveURL(/\/hiring$/);
  await page.goto("/hiring?recovery=1");
  await expect(page.getByText("This reset link is unavailable or has expired. Request a new link.")).toBeVisible();
  await page.getByRole("button", { name: "Return to sign in" }).click();
  await expect(page.getByRole("heading", { name: "Sign in to see your listings" })).toBeVisible();
});

test("calculator community link has readable contrast", async ({ page }) => {
  await page.goto("/calculator");
  await page.getByRole("textbox", { name: /Monthly gross pay/ }).fill("500000");
  await page.getByRole("button", { name: "Calculate take-home pay", exact: true }).click();
  const link = page.getByRole("link", { name: /Explore or share salary knowledge/ });
  await expect(link).toBeVisible();
  const ratio = await link.evaluate(el => {
    const luminance = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    const a = luminance(getComputedStyle(el).color);
    const b = luminance(getComputedStyle(el.closest("section")!).backgroundColor);
    return (Math.max(a,b) + .05) / (Math.min(a,b) + .05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test("hiring recovery updates the password before returning to listings", async ({ page }) => {
  const user = { id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", email: "ux@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
  let updates = 0;
  await page.route("**/auth/v1/user", async route => {
    if (route.request().method() === "PUT") updates++;
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(user) });
  });
  await page.route("**/rest/v1/rpc/employer_hiring_records", route => route.fulfill({ contentType: "application/json", body: "[]" }));
  const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test`;
  await page.goto(`/hiring?recovery=1#access_token=${token}&refresh_token=test-only&expires_in=3600&token_type=bearer&type=recovery`);
  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible();
  await page.getByLabel("New password", { exact: true }).fill("Test-only-new-password!");
  await page.getByLabel("Confirm new password", { exact: true }).fill("Different-password!");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByRole("status")).toContainText("The passwords do not match");
  expect(updates).toBe(0);
  await page.getByLabel("Confirm new password", { exact: true }).fill("Test-only-new-password!");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("No listings yet", { exact: true })).toBeVisible();
  expect(updates).toBe(1);
  await expect(page).toHaveURL(/\/hiring$/);
});
