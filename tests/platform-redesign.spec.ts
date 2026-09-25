import { expect, test } from "@playwright/test";

test.describe("work-and-pay platform redesign", () => {
  test("gateway sends each audience to a focused homepage and useful task", async ({ page }) => {
    test.setTimeout(90_000);
    const consoleErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    await page.context().clearCookies();
    await page.goto("/");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "How do you want to use SalarySabi?" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Salary na promise. Take-home na reality." })).toBeVisible();
    await expect(page.locator(".gateway-path-list, .gateway-directory")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Calculate my pay", exact: true })).toHaveAttribute("href", "#home-gross");
    await page.getByRole("link", { name: /^(For employers|Employers)$/ }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/employers$/);
    await page.getByRole("main").getByRole("link", { name: "Run payroll" }).click();
    await expect(page).toHaveURL(/\/payroll$/);
    await expect(page.getByRole("heading", { name: "Small-team payroll" })).toBeVisible();
    await page.getByText("Supported payroll and limitations", { exact: true }).click();
    await expect(page.getByRole("heading", { name: "Built for straightforward monthly payroll." })).toBeVisible();
    await expect(page.getByText(/Bonuses, commissions, arrears or irregular pay/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Forgot password?" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Salary na promise/i })).toHaveCount(0);
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "For employers" })).toHaveAttribute("aria-current", "page");
    } else {
      await expect(page.getByRole("navigation", { name: "For employers tools" })).toBeVisible();
      await expect(page.getByRole("link", { name: "For employers" }).last()).toHaveAttribute("href", "/employers");
    }
    expect(consoleErrors).toEqual([]);
  });

  test("homepage reflows without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("individual and employer homepages contain only their own tasks", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    await page.context().clearCookies();
    await page.goto("/individuals");
    await expect(page.getByRole("heading", { name: "Know your actual salary." })).toHaveCount(0);
    await expect(page.getByLabel("Example take-home pay calculation")).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("link", { name: "Check my payslip" })).toHaveAttribute("href", "/calculator?mode=check");
    await expect(page.getByRole("heading", { name: "Know your pay. Plan your next move." })).toBeVisible();
    await expect(page.locator(".audience-navigation")).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("link", { name: "Calculate my take-home" })).toHaveAttribute("href", "/calculator");
    await expect(page.getByText(/See your PAYE, deductions, and take-home pay/i)).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("link", { name: "Compare and share salaries" })).toHaveAttribute("href", "/salaries");
    await expect(page.locator(".talent-trust-strip")).toHaveCount(0);
    await expect(page.locator(".info-footer a[href='/tax-updates']").first()).toHaveAttribute("href", "/tax-updates");
    await expect(page.getByRole("main").getByRole("link", { name: "Run payroll" })).toHaveCount(0);
    await page.goto("/employers");
    await expect(page.getByRole("main").getByRole("link", { name: "Post a job" })).toHaveAttribute("href", "/post-a-job");
    await expect(page.getByRole("link", { name: "Calculate & verify pay" })).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });

  test("payroll password recovery gives a privacy-safe confirmation", async ({ page }) => {
    await page.route("**/auth/v1/recover*", async (route) => {
      await route.fulfill({ contentType: "application/json", body: "{}" });
    });
    await page.goto("/payroll");
    await page.getByLabel("Email").fill("owner@example.com");
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await expect(page.getByRole("status")).toContainText("If an account exists for that email");
  });

  test("admin fixture loads review work and gates publication", async ({ page }) => {
    await page.goto("/admin?fixture=1");
    await expect(page.getByRole("heading", { name: "Senior DevOps Engineer" })).toBeVisible();
    await expect(page.locator(".admin-review-queue > header strong")).toHaveText("3");
    const publish = page.getByRole("button", { name: "Complete 3 checks to publish" });
    await expect(publish).toBeDisabled();
    await expect(page.getByText("0 of 3 complete")).toBeVisible();
    await page.getByRole("checkbox", { name: /application is active/i }).check();
    await page.getByRole("checkbox", { name: /salary matches the source/i }).check();
    await page.getByRole("checkbox", { name: /source confidence is acceptable/i }).check();
    await expect(page.getByText("3 of 3 complete")).toBeVisible();
    await expect(page.locator(".admin-review-actions")).toHaveCSS("position", "sticky");
    await expect(page.getByRole("button", { name: "Publish verified job" })).toBeEnabled();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);

    if ((page.viewportSize()?.width ?? 1000) <= 720) {
      await page.locator(".admin-more-menu > summary").click();
    }
    await page.getByRole("button", { name: "Add job" }).click();
    await page.getByRole("tab", { name: /Connect an ATS/i }).click();
    await page.getByRole("button", { name: "Edit Kuda ATS source" }).click();
    const editSource = page.locator(".admin-import-source-edit-form");
    await editSource.getByLabel("Employer name").fill("Kuda Nigeria");
    await editSource.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Kuda Nigeria was updated.", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit Kuda Nigeria ATS source" })).toBeVisible();
    await page.getByRole("button", { name: "Test and import Kuda Nigeria ATS source now" }).click();
    await expect(page.getByText("Kuda Nigeria: 8 jobs found", { exact: false })).toBeVisible();
    await expect(page.getByText("8 found · 2 Nigeria-relevant · 1 with salary · 1 drafted")).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove Flutterwave ATS source" })).toBeVisible();
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Remove Flutterwave ATS source" }).click();
    await expect(page.getByText("Flutterwave was removed from automatic imports.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove Flutterwave ATS source" })).toHaveCount(0);
  });

  test("admin jobs workspace separates lifecycles and guards permanent deletion", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-08-20T12:00:00Z"));
    await page.goto("/admin?fixture=1");
    await page.getByRole("button", { name: "Jobs", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Jobs", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: /All jobs/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".admin-job-list").getByText("Operations Manager", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: /Live 1/ }).click();
    await expect(page.locator(".admin-job-list").getByText("Product Manager", { exact: true })).toBeVisible();
    await expect(page.locator(".admin-job-detail")).toBeHidden();
    await expect(page.getByText("Operations Manager", { exact: true })).toHaveCount(0);

    await page.getByRole("tab", { name: /Expired 1/ }).click();
    await expect(page.getByText("Operations Manager", { exact: true }).first()).toBeVisible();
    await page.locator(".admin-job-list article > button").filter({ hasText: "Operations Manager" }).click();
    await expect(page.getByLabel("Title", { exact: true })).toBeHidden();
    await page.getByRole("button", { name: "Delete listing", exact: true }).click();
    const confirmation = page.getByLabel(/Type Operations Manager to confirm/);
    const deleteButton = page.locator(".admin-delete-confirmation").getByRole("button", { name: "Delete permanently" });
    await expect(deleteButton).toBeDisabled();
    await confirmation.fill("Operations");
    await expect(deleteButton).toBeDisabled();
    await confirmation.fill("Operations Manager");
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();
    await expect(page.getByText("No expired jobs.")).toBeVisible();
    await expect(page.getByText("Operations Manager was permanently deleted. Local fixture only.")).toBeVisible();

    await page.getByRole("tab", { name: /Archived 1/ }).click();
    await expect(page.getByText("Finance Manager", { exact: true }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
});

 test("admin empty review is compact and header has breathing room", async ({ page }) => {
  await page.goto("/admin?fixture=1");
  await expect(page.getByRole("heading", { name: "Senior DevOps Engineer" })).toBeVisible();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(page.getByRole("heading", { name: "All caught up." })).toBeVisible();
  await expect(page.locator(".admin-review-workspace")).toHaveCount(0);
  await expect(page.locator(".admin-import-status")).not.toHaveAttribute("open");
  const header = await page.locator(".admin-topbar").boundingBox();
  expect(header?.y).toBeGreaterThanOrEqual(16);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByText("Automatic imports", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Manage sources" })).toBeVisible();
 });

test("expired jobs support confirmed bulk deletion", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-20T12:00:00Z"));
  await page.goto("/admin?fixture=1");
  await page.getByRole("button", { name: "Jobs", exact: true }).click();
  await page.getByRole("tab", { name: /Expired 1/ }).click();
  await page.getByLabel("Select all expired jobs", { exact: true }).check();
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Delete selected", exact: true }).click();
  await expect(page.getByText("Operations Manager", { exact: true })).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Delete selected", exact: true }).click();
  await expect(page.getByText("No expired jobs.")).toBeVisible();
  await expect(page.getByText("1 expired listings deleted.")).toBeVisible();
});
