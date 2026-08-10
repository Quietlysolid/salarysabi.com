import { expect, test } from "@playwright/test";

test("disclaimer ledger remains isolated and readable", async ({ page }, testInfo) => {
  await page.goto("/disclaimer");
  const rows = page.locator(".disclaimer-ledger-row");

  await expect(rows).toHaveCount(4);
  await expect(page.locator(".evidence-row")).toHaveCount(0);
  await expect(page.locator(".methodology-evidence-row")).toHaveCount(0);

  const columns = await rows.first().evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(testInfo.project.name === "mobile-chromium" ? 1 : 3);
  await expect(page.locator(".disclaimer-ledger-warning")).toBeVisible();
  if (testInfo.project.name === "mobile-chromium") {
    const actions = page.locator(".disclaimer-ledger-actions a");
    await expect(actions).toHaveCount(3);
    for (const action of await actions.all()) await expect(action).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("methodology rows cannot inherit disclaimer layout", async ({ page }, testInfo) => {
  await page.goto("/how-paye-is-calculated");
  const rows = page.locator(".methodology-evidence-row");

  await expect(rows).toHaveCount(2);
  await expect(page.locator(".disclaimer-ledger-row")).toHaveCount(0);
  const columns = await rows.first().evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(testInfo.project.name === "mobile-chromium" ? 2 : 3);
  const actions = page.locator(".methodology-actions a");
  await expect(actions).toHaveCount(2);
  expect(Math.min(...await actions.evaluateAll((links) => links.map((link) => link.getBoundingClientRect().height)))).toBeGreaterThanOrEqual(48);
  const ruleColumns = await page.locator(".methodology-rules").evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(ruleColumns).toBe(testInfo.project.name === "mobile-chromium" ? 1 : 3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("jobs listings and responsive filters remain usable", async ({ page }, testInfo) => {
  await page.goto("/jobs");
  await expect(page.locator(".job-card").first()).toBeVisible();
  if (testInfo.project.name === "mobile-chromium") {
    const actionHeights = await page.locator(".job-card-footer a").first().evaluateAll((links) => links.map((link) => link.getBoundingClientRect().height));
    expect(Math.min(...actionHeights)).toBeGreaterThanOrEqual(44);
  }

  const filterToggle = page.getByRole("button", { name: "Filter jobs" });
  if (testInfo.project.name === "mobile-chromium") {
    await expect(filterToggle).toBeVisible();
    await expect(page.locator("#job-search-filters")).toBeHidden();
    await filterToggle.click();
    await expect(page.locator("#job-search-filters")).toBeVisible();
    await expect(page.locator(".job-filter-toggle")).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("button", { name: "Hide filters" })).toBeVisible();
  } else {
    await expect(filterToggle).toBeHidden();
    await expect(page.locator("#job-search-filters")).toBeVisible();
  }
  await page.locator('#job-search-filters input[placeholder*="Job title"]').fill("no-such-salarysabi-role");
  await expect(page.locator(".product-state-empty")).toContainText("No matching jobs yet");
  await page.locator(".product-state-empty button").click();
  await expect(page.locator(".job-card").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("shared public shell retains its landmarks", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByLabel("SalarySabi home").first()).toBeVisible();
  await expect(page.locator(".info-footer")).toBeVisible();
  const wordmark = page.locator(".info-footer .brand-wordmark");
  expect(await wordmark.evaluate((node) => getComputedStyle(node).whiteSpace)).toBe("nowrap");
  expect(await page.locator(".info-footer .footer-brand").evaluate((node) => getComputedStyle(node).textDecorationLine)).toBe("none");
});

test("wordmark final i uses the native typeface without an overlaid dot", async ({ page }, testInfo) => {
  await page.goto("/");
  const wordmark = page.locator(".info-header .brand-wordmark");
  await expect(wordmark).toHaveText("SalarySabi");
  await expect(wordmark.locator(".brand-i")).toHaveText("i");
  const finalI = await wordmark.locator(".brand-i").evaluate((node) => {
    const dot = getComputedStyle(node, "::after");
    return { content: dot.content, position: getComputedStyle(node).position };
  });
  expect(finalI.content).toBe("none");
  expect(finalI.position).toBe("static");
  await page.locator(".info-header .brand").screenshot({ path: `design-audit/wordmark-i-fixed-${testInfo.project.name}.png` });
});

test("administrator entry presents an intentional restricted workspace", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1, name: "SalarySabi jobs administration" })).toBeVisible();
  await expect(page.locator(".admin-entry-brand")).toContainText("Internal operations");
  await expect(page.locator(".admin-entry-intro")).toContainText("Approved administrators only");
  await expect(page.locator(".admin-entry-intro")).toContainText("Managed securely in this browser");
  await expect(page.getByRole("link", { name: "Return to salary-transparent jobs" })).toHaveAttribute("href", "/jobs");
  await expect(page.getByRole("button", { name: "Sign in securely" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("refinement keeps labels readable, text links obvious and trust concise", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".guided-assurance")).toHaveCount(1);
  await expect(page.locator(".guided-trust")).toHaveCount(0);
  await expect(page.locator(".guided-assurance")).toContainText("Private estimate using verified 2026 rules");
  const eyebrowSize = await page.locator(".guided-home-hero .eyebrow").evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
  expect(eyebrowSize).toBeGreaterThanOrEqual(12);

  await page.goto("/how-paye-is-calculated");
  const contentsLink = page.locator(".methodology-contents a").first();
  await expect(contentsLink).toBeVisible();
  expect(await contentsLink.evaluate((node) => getComputedStyle(node).textDecorationLine)).toContain("underline");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("privacy supports a short reading path before the full ledger", async ({ page }, testInfo) => {
  await page.goto("/privacy");
  await expect(page.locator(".privacy-page-nav a")).toHaveCount(3);
  expect(await page.locator(".privacy-page-nav").evaluate((node) => Number.parseFloat(getComputedStyle(node).gap))).toBe(0);
  const privacyNavCells = await page.locator(".privacy-page-nav > *").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
  if (testInfo.project.name === "desktop-chromium") {
    for (let index = 1; index < privacyNavCells.length; index += 1) {
      expect(Math.abs(privacyNavCells[index - 1].right - privacyNavCells[index].left)).toBeLessThanOrEqual(1);
    }
  }
  await expect(page.locator(".privacy-summary li")).toHaveCount(4);
  await expect(page.getByRole("heading", { level: 2, name: "Four things to know" })).toBeVisible();
  await expect(page.locator(".privacy-ledger-row")).toHaveCount(7);
  await expect(page.locator(".privacy-request-action")).toHaveText("Request an update or deletion");
  const columns = await page.locator(".privacy-ledger-row").first().evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(testInfo.project.name === "mobile-chromium" ? 1 : 4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("disclaimer moves directly from the ledger to its actions", async ({ page }) => {
  await page.goto("/disclaimer");
  await expect(page.locator(".disclaimer-ledger-dates")).toHaveCount(0);
  const ledgerBottom = await page.locator(".disclaimer-ledger").evaluate((node) => node.getBoundingClientRect().bottom);
  const actionsTop = await page.locator(".disclaimer-ledger-actions").evaluate((node) => node.getBoundingClientRect().top);
  expect(actionsTop - ledgerBottom).toBeLessThanOrEqual(1);
  expect(await page.locator(".disclaimer-ledger-actions").evaluate((node) => Number.parseFloat(getComputedStyle(node).gap))).toBe(0);
  const actionCells = await page.locator(".disclaimer-ledger-actions > a").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
  for (let index = 1; index < actionCells.length; index += 1) {
    const seam = actionCells[index].left > actionCells[index - 1].left
      ? actionCells[index].left - actionCells[index - 1].right
      : actionCells[index].top - actionCells[index - 1].bottom;
    expect(Math.abs(seam)).toBeLessThanOrEqual(1);
  }
});

test("job navigation and submission paths state their audience", async ({ page }) => {
  await page.goto("/jobs");
  await expect(page.locator('nav[aria-label="Primary navigation"] a[href="/account"]')).toHaveText("Job workspace");
  await expect(page.locator('.jobs-next-actions a[href="/suggest-a-job"]')).toContainText("For job seekers");
  await expect(page.locator('.jobs-next-actions a[href="/suggest-a-job"]')).toContainText("Share an existing job");
  await expect(page.locator('.jobs-next-actions a[href="/post-a-job"]')).toContainText("For employers and recruiters");
  await expect(page.locator('.jobs-next-actions a[href="/post-a-job"]')).toContainText("Post your own job");
  await page.goto("/suggest-a-job");
  await expect(page.getByRole("heading", { level: 1, name: "Share an existing job" })).toBeVisible();
  await expect(page.locator(".submission-path-note")).toContainText("Are you the employer?");
  const suggestionAlignment = await page.locator(".form-page-hero-short, .standalone-job-form-short").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
  expect(Math.abs(suggestionAlignment[0].left - suggestionAlignment[1].left)).toBeLessThanOrEqual(1);
  expect(Math.abs(suggestionAlignment[0].width - suggestionAlignment[1].width)).toBeLessThanOrEqual(1);
  await page.goto("/post-a-job");
  await expect(page.getByRole("heading", { level: 1, name: "Post your own salary-transparent job" })).toBeVisible();
  await expect(page.locator(".submission-path-note")).toContainText("Not the employer or recruiter?");
  const postAlignment = await page.locator(".job-wizard-hero, .job-wizard-shell").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
  expect(Math.abs(postAlignment[0].left - postAlignment[1].left)).toBeLessThanOrEqual(1);
  expect(Math.abs(postAlignment[0].width - postAlignment[1].width)).toBeLessThanOrEqual(1);
  const progressSteps = await page.locator(".wizard-progress button").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
  const progressSeam = progressSteps[1].left > progressSteps[0].left
    ? progressSteps[1].left - progressSteps[0].right
    : progressSteps[1].top - progressSteps[0].bottom;
  expect(Math.abs(progressSeam)).toBeLessThanOrEqual(1);
});

test("PAYE guide index connects its three child guides", async ({ page }) => {
  await page.goto("/paye-guide");
  await expect(page.getByRole("heading", { level: 1, name: "Understand every number in your PAYE estimate." })).toBeVisible();
  await expect(page.locator(".paye-guide-card")).toHaveCount(3);
  await expect(page.getByRole("link", { name: /Follow the calculation/ })).toHaveAttribute("href", "/how-paye-is-calculated");
  await expect(page.getByRole("link", { name: /Check eligible deductions/ })).toHaveAttribute("href", "/eligible-deductions");
  await expect(page.getByRole("link", { name: /View the tax bands/ })).toHaveAttribute("href", "/tax-bands");
  const guideActions = page.locator(".paye-guide-actions a");
  await expect(guideActions).toHaveCount(2);
  const actionWidths = await guideActions.evaluateAll((links) => links.map((link) => link.getBoundingClientRect().width));
  expect(Math.min(...actionWidths)).toBeGreaterThanOrEqual(180);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.goto("/eligible-deductions");
  await expect(page.locator('.paye-guide-trail a[aria-current="page"]')).toHaveText(/Eligible deductions/);
  expect(await page.locator(".paye-guide-trail").evaluate((node) => Number.parseFloat(getComputedStyle(node).gap))).toBe(0);
  const trailCells = await page.locator(".paye-guide-trail > *").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
  expect(Math.abs(trailCells[0].right - trailCells[1].left)).toBeLessThanOrEqual(1);
  await expect(page.locator('nav[aria-label="Primary navigation"] a[aria-current="page"]')).toHaveText("PAYE guide");
});

test("tax bands explain marginal rates with a worked example", async ({ page }, testInfo) => {
  await page.goto("/tax-bands");

  await expect(page.getByRole("heading", { level: 2, name: "See how ₦6 million is divided" })).toBeVisible();
  await expect(page.locator(".tax-bands-stack > div")).toHaveCount(3);
  await expect(page.locator(".tax-bands-total")).toContainText("₦870,000");
  await expect(page.locator(".tax-bands-rule")).toContainText("does not apply to all ₦6 million");
  await expect(page.locator('.tax-bands-table [role="row"]')).toHaveCount(7);
  const contentsColumns = await page.locator(".info-contents > div").evaluate((node) =>
    getComputedStyle(node).gridTemplateColumns.split(" ").length,
  );
  expect(contentsColumns).toBe(testInfo.project.name === "mobile-chromium" ? 1 : 3);

  const stackColumns = await page.locator(".tax-bands-stack").evaluate((node) =>
    getComputedStyle(node).gridTemplateColumns.split(" ").length,
  );
  expect(stackColumns).toBe(testInfo.project.name === "mobile-chromium" ? 1 : 3);
  const tableColumns = await page.locator(".tax-bands-table [role='row']").nth(1).evaluate((node) =>
    getComputedStyle(node).gridTemplateColumns.split(" ").length,
  );
  expect(tableColumns).toBe(testInfo.project.name === "mobile-chromium" ? 2 : 4);
  if (testInfo.project.name === "mobile-chromium") {
    await expect(page.locator('.tax-bands-table [data-label="Income range"]').first()).toBeVisible();
    const labelSize = await page.locator('.tax-bands-table [data-label="Rate"]').first().evaluate((node) => Number.parseFloat(getComputedStyle(node, "::before").fontSize));
    expect(labelSize).toBeGreaterThanOrEqual(12);
  } else {
    const ranges = page.locator('.tax-bands-table [data-label="Income range"]');
    await expect(ranges).toHaveCount(6);
    expect(await ranges.first().evaluate((node) => getComputedStyle(node).whiteSpace)).toBe("nowrap");
    expect(await ranges.evaluateAll((nodes) => nodes.every((node) => node.scrollWidth <= node.clientWidth))).toBe(true);
    expect(await page.locator('.tax-bands-table [role="row"]').evaluateAll((rows) => rows.every((row) => row.scrollWidth <= row.clientWidth))).toBe(true);
    const tableRight = await page.locator(".tax-bands-table").evaluate((node) => node.getBoundingClientRect().right);
    const finalCells = await page.locator('.tax-bands-table [role="row"] > :last-child').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().right));
    expect(Math.max(...finalCells)).toBeLessThanOrEqual(tableRight + 1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("pay context survives guidance and carries into the payslip checker", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.locator("#calculator-gross").fill("600000");
  await page.getByRole("button", { name: /Add pension, rent or other deductions/ }).click();
  await page.locator("#calculator-pension").fill("40000");
  await page.locator('a[href^="/eligible-deductions?from=calculator#pension"]').click();
  await expect(page).toHaveURL(/eligible-deductions.*#pension/);

  await page.getByRole("link", { name: "Return to the PAYE calculation" }).click();
  await expect(page).toHaveURL(/restore=deduction#calculator/);
  await expect(page.locator("#calculator-gross")).toHaveValue("600,000");
  await expect(page.locator("#calculator-pension")).toHaveValue("40,000");
  await expect(page.locator("#calculator-pension")).toBeFocused();

  await page.getByRole("button", { name: "Show my PAYE estimate" }).click();
  await page.getByRole("link", { name: /Carry this salary into the payslip checker/ }).click();
  await expect(page).toHaveURL(/payslip-checker\?from=calculator/);
  await expect(page.locator(".payslip-required-fields input").first()).toHaveValue("600,000");
  await expect(page.locator(".payslip-carried-context")).toContainText("₦600,000 monthly gross pay");
  await expect(page.getByRole("link", { name: "How PAYE is calculated" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Deductions that can reduce PAYE" })).toBeVisible();
  if (testInfo.project.name === "desktop-chromium") {
    const headingTop = await page.locator(".payslip-hero h1").evaluate((node) => node.getBoundingClientRect().top);
    const resultTop = await page.locator(".payslip-result").evaluate((node) => node.getBoundingClientRect().top);
    expect(Math.abs(resultTop - headingTop)).toBeLessThanOrEqual(4);
  }
});

test("populated job detail exposes source and account actions", async ({ page }) => {
  await page.goto("/jobs");
  const href = await page.locator(".job-card").first().getByRole("link", { name: "View job" }).getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expect(page.locator(".job-detail h1")).toBeVisible();
  await expect(page.locator(".job-pay-panel")).toContainText("Advertised salary");
  await expect(page.locator(".job-source-panel")).toContainText("Source checked");
  await expect(page.locator(".job-user-actions")).toContainText("Save or track this job");
  await expect(page.getByRole("link", { name: "Sign in or create an account" })).toBeVisible();
});

test("authenticated workspace fixture exercises populated and changed states", async ({ page }) => {
  await page.goto("/e2e-fixtures/workspace");
  await expect(page.getByRole("heading", { level: 1, name: "workspace-fixture@salarysabi.test" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Product Designer" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Finance Analyst" })).toBeVisible();
  await expect(page.getByText("Product design", { exact: true })).toBeVisible();
  const signOut = page.getByRole("button", { name: "Sign out" });
  await expect(signOut).toBeVisible();
  expect((await signOut.boundingBox())!.x + (await signOut.boundingBox())!.width).toBeLessThanOrEqual(page.viewportSize()!.width);

  await page.getByLabel("Application status for Finance Analyst").selectOption("interviewing");
  await expect(page.getByLabel("Application status for Finance Analyst")).toHaveValue("interviewing");
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("No saved jobs yet", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("No job alerts yet", { exact: true })).toBeVisible();

  const actionSection = page.locator(".workspace-fixture-job-actions");
  await actionSection.getByRole("button", { name: "Save job" }).click();
  await expect(actionSection.getByRole("button", { name: "Remove saved job" })).toBeVisible();
  await actionSection.getByRole("button", { name: "Mark as applied" }).click();
  await expect(actionSection.getByRole("button", { name: "Application recorded" })).toBeVisible();
});

test("calculator exports produce private PDF and spreadsheet downloads", async ({ page }) => {
  await page.goto("/");
  await page.locator("#calculator-gross").fill("750000");
  await page.getByRole("button", { name: "Show my PAYE estimate" }).click();
  const pdfPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF" }).click();
  const pdf = await pdfPromise;
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/i);
  const excelPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Excel" }).click();
  const excel = await excelPromise;
  expect(excel.suggestedFilename()).toMatch(/\.xls$/i);
});

test("community job submission validates, succeeds and recovers from failure", async ({ page }) => {
  let requests = 0;
  await page.route("**/rest/v1/job_suggestions**", async (route) => {
    requests += 1;
    await route.fulfill({ status: requests === 1 ? 201 : 503, body: "" });
  });
  await page.goto("/suggest-a-job");
  await page.getByRole("button", { name: "Send job" }).click();
  await expect(page.getByLabel("Company name")).toBeFocused();

  const fillSuggestion = async () => {
    await page.getByLabel("Company name").fill("Fixture Company");
    await page.getByLabel("Salary shown").fill("NGN 400,000 monthly");
    await page.getByLabel("Company job link").fill("https://example.test/careers/role");
    await page.getByLabel("Your email, optional").fill("FIXTURE@EXAMPLE.TEST");
  };
  await fillSuggestion();
  await page.getByRole("button", { name: "Send job" }).click();
  await expect(page.getByRole("status")).toContainText("We’ll check the company page");
  await fillSuggestion();
  await page.getByRole("button", { name: "Send job" }).click();
  await expect(page.getByRole("status")).toContainText("could not save this suggestion");
  await expect(page.getByLabel("Company name")).toHaveValue("Fixture Company");
});

test("employer submission validates each step and confirms local success", async ({ page }) => {
  let submissions = 0;
  await page.route("**/rest/v1/job_submissions**", async (route) => {
    submissions += 1;
    await route.fulfill({ status: 201, body: "" });
  });
  await page.goto("/post-a-job");
  await page.getByRole("button", { name: "Continue to pay" }).click();
  await expect(page.getByLabel("Job title *")).toBeFocused();
  await page.getByLabel("Job title *").fill("Senior Product Designer");
  await page.getByLabel("Company name *").fill("Fixture Company");
  await page.getByLabel("Location *").fill("Lagos, Nigeria");
  await page.getByRole("button", { name: "Continue to pay" }).click();
  await page.getByLabel("Minimum salary *").fill("500000");
  await page.getByLabel("Maximum salary *").fill("800000");
  await page.getByRole("button", { name: "Continue to application" }).click();
  await page.getByLabel("Application deadline *").fill("2026-09-30");
  await page.getByLabel("Application link *").fill("https://example.test/apply");
  await page.getByLabel("Contact email *").fill("hiring@example.test");
  await page.getByLabel("Full job description *").fill("This fixture description is intentionally long enough to satisfy the minimum required length for a complete role submission test.");
  await page.getByLabel(/I confirm that candidates/).check();
  await page.getByRole("button", { name: "Submit job for review" }).click();
  await expect(page.getByRole("status")).toContainText("Submitted for review");
  expect(submissions).toBe(1);
});
