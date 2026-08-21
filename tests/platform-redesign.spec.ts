import { expect, test } from "@playwright/test";

test.describe("work-and-pay platform redesign", () => {
  test("homepage presents the full platform and keeps the calculator usable", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    await page.route("**/rest/v1/rpc/public_active_contribution_campaigns", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify([{
          slug: "salary-pilot-2026",
          contribution_type: "salary_report",
          reward_kobo: 100000,
          budget_remaining_kobo: 2000000,
          ends_at: "2026-11-09T00:00:00.000Z",
        }]),
      });
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Check your take-home pay/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pay & tax", exact: true }).first()).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Jobs & salaries", exact: true })).toBeVisible();
    await expect(page.getByLabel("Active funded contributor offer")).toContainText("Help make Nigerian pay clearer. Earn ₦1,000 for an approved salary report.");
    await expect(page.getByRole("heading", { name: "Everything around pay, in one place." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Numbers you can inspect." })).toBeVisible();
    await expect(page.getByRole("link", { name: /See funded offers/i }).first()).toHaveAttribute("href", "/contributors");
    await page.getByLabel("Salary before deductions").fill("750000");
    await page.getByRole("button", { name: "Calculate take-home pay" }).click();
    await expect(page.getByRole("link", { name: /Verify with my payslip/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Compare my salary/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Find jobs with published pay/i })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("salary contribution validates identity-free context before pay details", async ({ page }) => {
    await page.goto("/salaries");
    await expect(page.getByText("Public comparisons are building.")).toBeVisible();
    await page.getByRole("button", { name: "Share without a reward" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator('input[name="role"]')).toBeFocused();
    await page.locator('input[name="role"]').fill("Product designer");
    await page.locator('input[name="industry"]').fill("Technology");
    await page.locator('input[name="location"]').fill("Lagos");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Step 2 of 2")).toBeVisible();
    await expect(page.locator('input[name="gross"]')).toBeVisible();
  });

  test("homepage reflows without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("contributor programme explains approval and budget boundaries", async ({ page }) => {
    await page.route("**/rest/v1/rpc/public_active_contribution_campaigns", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify([{
          slug: "salary-pilot-2026",
          contribution_type: "salary_report",
          reward_kobo: 100000,
          budget_remaining_kobo: 2000000,
          ends_at: "2026-11-09T00:00:00.000Z",
        }, {
          slug: "transparent-jobs-pilot-2026",
          contribution_type: "job_source",
          reward_kobo: 100000,
          budget_remaining_kobo: 6000000,
          ends_at: "2026-11-09T00:00:00.000Z",
        }]),
      });
    });
    await page.goto("/contributors");
    await expect(page.getByRole("heading", { name: /Help make Nigerian pay transparent./i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Share your own salary" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Find a job with published pay" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Check job-lead requirements" })).toHaveAttribute("href", "/contributors/job-sourcing");
    await expect(page.getByRole("heading", { name: "Know someone with useful pay information?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Share on WhatsApp" })).toHaveAttribute("href", /wa\.me/);
    await expect(page.getByRole("link", { name: "View my contributions and rewards" })).toHaveAttribute("href", "/contributions");
    await expect(page.getByLabel("Active funded contributor offer")).toHaveCount(0);
    await page.getByRole("button", { name: "Check salary-report eligibility" }).click();
    await expect(page.getByText(/Only one paid salary report is allowed per person/i)).toBeVisible();
    await expect(page.getByText(/benchmark needs five similar approved reports/i)).toBeVisible();
  });

  test("contributor account explains every claim state and safely previews payout", async ({ page }) => {
    await page.goto("/contributions?fixture=1");
    await expect(page.getByRole("heading", { name: "Rewards and review status" })).toBeVisible();
    await expect(page.getByText("In review", { exact: true })).toBeVisible();
    await expect(page.getByText("Approved", { exact: true })).toBeVisible();
    await expect(page.getByText("Not approved", { exact: true })).toBeVisible();
    await expect(page.getByText("The employer page no longer accepted applications when reviewed.")).toBeVisible();
    await expect(page.getByText("Pilot target: reviewed within 5 business days.")).toBeVisible();
    await page.getByLabel("Amount in naira").fill("500");
    await page.getByLabel("Mobile number").fill("08012345678");
    await page.getByLabel(/I checked these payout details/).check();
    await page.getByRole("button", { name: "Request payout" }).click();
    await expect(page.getByText("Local preview payout requested. No production data changed.")).toBeVisible();
    await expect(page.getByText("Requested", { exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("job scout offer never promises a reward while its campaign is inactive", async ({ page }) => {
    await page.route("**/rest/v1/rpc/public_active_contribution_campaigns", async (route) => {
      await route.fulfill({ contentType: "application/json", body: "[]" });
    });
    await page.goto("/contributors/job-sourcing");
    await expect(page.getByRole("heading", { name: "Help uncover salary-transparent Nigerian jobs." })).toBeVisible();
    await expect(page.getByText("Paid submissions are not open right now.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Share an unpaid job tip" })).toBeVisible();

    await page.goto("/suggest-a-job?campaign=transparent-jobs-pilot-2026");
    await expect(page.getByText("This paid campaign is not accepting submissions.")).toBeVisible();
    await expect(page.getByText("No reward will be promised or reserved from this link.")).toBeVisible();
  });

  test("contributor admin fixture exposes evidence and locks reward approval", async ({ page }) => {
    await page.goto("/admin/contributors?fixture=1");
    await expect(page.getByText("Local review fixture—no production data will change.")).toBeVisible();
    await expect(page.getByText("Example Payments", { exact: true })).toBeVisible();
    const jobClaim = page.locator(".admin-claim-card").filter({ hasText: "Example Payments" });
    await expect(jobClaim.getByRole("button", { name: "Complete checks to approve" })).toBeDisabled();
    const checks = jobClaim.getByRole("checkbox");
    await expect(checks).toHaveCount(5);
    for (let index = 0; index < 5; index += 1) await checks.nth(index).check();
    await expect(jobClaim.getByRole("button", { name: "Approve reward" })).toBeEnabled();

    const salaryClaim = page.locator(".admin-claim-card").filter({ hasText: "Operations Analyst" });
    await expect(salaryClaim.getByRole("checkbox")).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Benchmark quarantine" })).toBeVisible();
    await expect(page.getByText("Quarantined · not public")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("empty calculator submission reports the problem without a zero result", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Calculate take-home pay" }).click();
    await expect(page.getByText("Enter your salary before calculating.")).toBeVisible();
    await expect(page.getByLabel("Salary before deductions")).toBeFocused();
    await expect(page.getByText("₦0")).toHaveCount(0);
  });

  test("admin fixture loads review work and gates publication", async ({ page }) => {
    await page.goto("/admin?fixture=1");
    await expect(page.getByText("Senior DevOps Engineer").first()).toBeVisible();
    await expect(page.locator(".admin-review-queue > header strong")).toHaveText("3");
    const publish = page.getByRole("button", { name: "Complete 3 checks to publish" });
    await expect(publish).toBeDisabled();
    await expect(page.getByText("0 of 3 complete")).toBeVisible();
    await page.getByRole("checkbox", { name: /application is active/i }).check();
    await page.getByRole("checkbox", { name: /salary matches the source/i }).check();
    await page.getByRole("checkbox", { name: /source confidence is acceptable/i }).check();
    await expect(page.getByText("3 of 3 complete")).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish verified job" })).toBeEnabled();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);

    await page.getByRole("button", { name: "Add job" }).click();
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
    await page.goto("/admin?fixture=1");
    await page.getByRole("button", { name: "Jobs", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Manage every listing" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Live 1/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: "Product Manager" })).toBeVisible();
    await expect(page.getByText("Operations Manager", { exact: true })).toHaveCount(0);

    await page.getByRole("tab", { name: /Expired 1/ }).click();
    await expect(page.getByText("Operations Manager", { exact: true }).first()).toBeVisible();
    await page.locator(".admin-job-detail").getByRole("button", { name: "Delete permanently" }).click();
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
