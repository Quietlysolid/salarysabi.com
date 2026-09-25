import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { legalContentUpdatedDate, rulesVerifiedDate } from "./site";
import { salaryTerms } from "./salary-terms";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("shared product contracts", () => {
  it("keeps trust dates in the site metadata source", () => {
    const consumers = [
      "src/app/page.tsx",
      "src/components/payslip-checker.tsx",
      "src/app/disclaimer/page.tsx",
      "src/app/privacy/page.tsx",
    ].map(read).join("\n");
    expect(rulesVerifiedDate).toBe("24 September 2026");
    expect(legalContentUpdatedDate).toBe("21 August 2026");
    expect(consumers).not.toContain("29 July 2026");
    expect(consumers).not.toContain("21 August 2026");
  });

  it("uses the split gateway home and the public shell on core public routes", () => {
    expect(read("src/app/page.tsx")).toContain("SplitGatewayHome");
    expect(read("src/app/individuals/page.tsx")).toContain('audience="talent"');
    expect(read("src/app/employers/page.tsx")).toContain('audience="employer"');
    expect(read("src/app/disclaimer/page.tsx")).toContain('permanentRedirect("/terms#estimates")');
    expect(read("src/app/privacy/page.tsx")).toContain("GatewayHeader");
    for (const route of ["src/app/jobs/page.tsx", "src/app/calculator/page.tsx", "src/app/account/page.tsx", "src/app/post-a-job/page.tsx", "src/app/how-paye-is-calculated/page.tsx", "src/app/salaries-and-jobs/page.tsx", "src/app/business/page.tsx"]) {
      expect(read(route)).toContain("PublicPageShell");
    }
  });

  it("uses one product-state contract for jobs and account states", () => {
    expect(read("src/components/job-board.tsx")).toContain("ProductState");
    expect(read("src/components/job-seeker-account.tsx")).toContain("ProductState");
  });

  it("keeps filtered and market-empty job recovery paths distinct", () => {
    const board = read("src/components/job-board.tsx");
    const page = read("src/app/jobs/page.tsx");
    expect(board).toContain("jobs.length === 0");
    expect(board).toContain("Our first jobs with published salaries are on the way.");
    expect(board).toContain("No jobs match your filters.");
    expect(page).toContain("(initialJobs?.length ?? 0) > 0");
  });

  it("keeps analytics events free of sensitive financial and credential properties", () => {
    const analytics = read("src/components/analytics.tsx");
    const endpoint = read("src/app/api/analytics/route.ts");
    expect(analytics).toContain("analyticsOptOutKey");
    expect(analytics).toContain('process.env.NODE_ENV !== "production"');
    expect(analytics).toContain("window.location.pathname");
    expect(analytics).toContain('fetch("/api/analytics"');
    expect(analytics).toContain("isPublicAnalyticsPath");
    expect(analytics).not.toContain("record_analytics_event");
    expect(endpoint).toContain("allowedBodyKeys");
    expect(endpoint).toContain("origin !== requestUrl.origin");
    expect(endpoint).toContain("ANALYTICS_API_RATE_LIMITER");
    expect(endpoint).toContain("botPattern");
    expect(endpoint).toContain("p_event_name: payload.event");
    expect(analytics).not.toContain("window.location.search");
    expect(analytics).not.toMatch(/posthog/i);
    expect(analytics).not.toMatch(/salary|deduction|password|payslip_value|email/i);
  });

  it("allows Cloudflare's production analytics beacon without weakening other CSP boundaries", () => {
    const config = read("next.config.ts");
    expect(config).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com");
    expect(config).toContain("connect-src 'self' https://*.supabase.co wss://*.supabase.co");
    expect(config).toContain("frame-ancestors 'none'");
  });

  it("keeps gross salary, chargeable income and net salary definitions synchronized", () => {
    const payeGuide = read("src/app/how-paye-is-calculated/page.tsx");
    const payslipChecker = read("src/components/payslip-checker.tsx");

    expect(salaryTerms.grossSalary).toContain("before employee deductions");
    expect(salaryTerms.grossSalary).toContain("basic salary and taxable allowances");
    expect(salaryTerms.chargeableIncome).toContain("after eligible deductions and reliefs");
    expect(salaryTerms.netSalary).toContain("PAYE and every other applicable payroll deduction");
    expect(payeGuide).toContain("salaryTerms.chargeableIncome");
    expect(payslipChecker).toContain('label="Monthly gross pay"');
    expect(payslipChecker).toContain('label="PAYE deducted"');
    expect(payslipChecker).toContain('label="Pension deducted"');
    expect(payslipChecker).toContain('placeholder="40,000" required');
  });

  it("keeps Your Pay Check private, actionable and connected to the next journey", () => {
    const checker = read("src/components/payslip-checker.tsx");
    const page = read("src/app/calculator/page.tsx");

    expect(checker).toContain('"calculate" | "check"');
    expect(checker).toContain("Your PAYE differs from our estimate.");
    expect(checker).toContain("navigator.clipboard.writeText");
    expect(checker).toContain("Ask payroll these questions");
    expect(checker).toContain('href="/salaries"');
    expect(checker).toContain('href="/jobs"');
    expect(checker).not.toContain("fetch(");
    expect(page).toContain("Take-home Pay Calculator & Payslip Check");
  });

  it("keeps the analytics allow-list synchronized with the database migration", () => {
    const migration = read("supabase/migrations/202609020001_repair_product_analytics.sql");
    const interestMigration = read("supabase/migrations/202609020002_deduction_tracker_interest.sql");
    const payslip = read("src/components/payslip-checker.tsx");
    for (const event of ["page_view", "paye_input_started", "paye_calculated", "paye_to_payslip_clicked", "payslip_check_started", "payslip_checked", "account_signup_succeeded", "job_apply_clicked"]) {
      expect(migration).toContain(`'${event}'`);
    }
    expect(migration).toContain("is_current_user_admin()");
    expect(migration).toContain("from auth.users");
    expect(migration).toContain("reporting_started_on");
    expect(migration).toContain("paye_guide_views");
    expect(migration).toContain("payslip_checker_views");
    for (const event of ["deduction_tracker_interest_yes", "deduction_tracker_interest_no"]) {
      expect(interestMigration).toContain(`'${event}'`);
    }
    expect(interestMigration).toContain("deduction_tracker_interest_yes");
    expect(interestMigration).toContain("deduction_tracker_interest_no");
    expect(payslip).toContain("checkCompleted.current");
  });

  it("finalises payroll through one owner-scoped database transaction", () => {
    const migration = read("supabase/migrations/202608080001_small_team_payroll.sql");
    const workspace = read("src/components/payroll-workspace.tsx");
    expect(migration).toContain("function public.finalise_payroll_run");
    expect(migration).toContain("owner_user_id = auth.uid()");
    expect(migration).toContain("Payroll items must match the active employee roster");
    expect(migration).toContain("status = 'superseded'");
    expect(workspace).toContain('supabase.rpc("finalise_payroll_run"');
    expect(workspace).not.toContain('supabase.from("payroll_run_items").insert');
    expect(workspace).toContain("Built for straightforward monthly payroll.");
    expect(workspace).toContain("Bonuses, commissions, arrears or irregular pay");
    expect(workspace).toContain('name="supported_scope" type="checkbox" required');
  });

  it("measures payroll activation and retention without copying payroll data", () => {
    const migration = read("supabase/migrations/202609010001_payroll_pilot_readiness.sql");
    const workspace = read("src/components/payroll-workspace.tsx");
    const launch = read("src/lib/launch.ts");
    for (const event of [
      "payroll_workspace_created",
      "payroll_first_employee_added",
      "payroll_import_completed",
      "payroll_run_finalised",
      "payroll_second_month_finalised",
      "payroll_register_downloaded",
      "payroll_payslip_downloaded",
    ]) {
      expect(migration).toContain(`'${event}'`);
      expect(launch).toContain(`"${event}"`);
    }
    expect(migration).toContain("count(distinct pay_period)");
    expect(migration).not.toMatch(/monthly_gross|monthly_paye|monthly_net|full_name|contact_email|owner_user_id/i);
    expect(workspace).toContain('track("payroll_import_completed")');
    expect(workspace).toContain('track("payroll_register_downloaded")');
    expect(workspace).toContain('track("payroll_payslip_downloaded")');
  });

  it("lets payroll employers request and complete secure password recovery", () => {
    const workspace = read("src/components/payroll-workspace.tsx");
    expect(workspace).toContain("resetPasswordForEmail");
    expect(workspace).toContain('event === "PASSWORD_RECOVERY"');
    expect(workspace).toContain("supabase.auth.updateUser({ password })");
    expect(workspace).toContain("The passwords do not match.");
    expect(workspace).toContain("If an account exists for that email");
  });

  it("uses a native final i so the wordmark remains typographically connected", () => {
    const wordmark = read("src/components/brand-wordmark.tsx");
    expect(wordmark).toContain('<span className="brand-i">i</span>');
    expect(wordmark).not.toContain("ı");
  });

  it("credits the SalarySabi product team", () => {
    const about = read("src/app/about/page.tsx");
    expect(about).toContain("Meet the team.");
    expect(about).toContain("Ozichi Nwosu");
    expect(about).toContain("Victoria Green");
    expect(about).toContain("https://www.linkedin.com/in/victoria-green1/");
    expect(about).toContain("Veno Green");
    expect(about).toContain("Udy Nwosu");
    expect(about).toContain("https://www.linkedin.com/in/veno-green-583766183/");
  });

  it("caps contributor liabilities in the database before accepting reward claims", () => {
    const migration = read("supabase/migrations/202608110002_contributor_program.sql");
    expect(migration).toContain("committed_kobo+c.reward_kobo>c.budget_kobo");
    expect(migration).toContain("Campaign budget exhausted");
    expect(migration).toContain("Contributor campaign limit reached");
    expect(migration).toContain("status text not null default 'draft'");
    expect(migration).toContain("admin_review_contribution_claim");
    expect(migration).toContain("contributor_ledger_one_reward_per_claim");
    expect(migration).toContain("request_contributor_payout");
    expect(migration).toContain("Payout exceeds available balance");
    expect(migration).toContain("admin_complete_contributor_payout");
    expect(migration).toContain("-request.amount_kobo");
  });

  it("keeps manual ATS imports admin-only and source-scoped", () => {
    const importer = read("supabase/functions/import-ats-jobs/index.ts");
    const dashboard = read("src/components/admin-dashboard.tsx");
    expect(importer).toContain("isAdminRequest");
    expect(importer).toContain('.from("admin_users")');
    expect(importer).toContain("admin && !sourceId");
    expect(importer).toContain("sourceResults");
    expect(dashboard).toContain("Test & import now");
    expect(dashboard).toContain('body: { sourceId: source.id }');
  });

  it("keeps permanent job deletion admin-only, archive-first and explicitly confirmed", () => {
    const migration = read("supabase/migrations/202608210001_admin_job_lifecycle.sql");
    const dashboard = read("src/components/admin-dashboard.tsx");
    expect(migration).toContain("'archived'");
    expect(migration).toContain("if not public.is_current_user_admin()");
    expect(migration).toContain("Archive or expire this job before deleting it permanently");
    expect(migration).toContain("p_confirmation");
    expect(migration).toContain("delete from public.jobs");
    expect(dashboard).toContain("Archive selected");
    expect(dashboard).toContain("Type <strong>{selectedManagedJob.title}</strong> to confirm");
    expect(dashboard).toContain('supabase.rpc("admin_delete_job"');
  });
});

describe("search visibility contracts", () => {
  it("keeps indexable job pages self-canonical", () => {
    const jobPage = read("src/app/jobs/[slug]/page.tsx");
    expect(jobPage).toContain('alternates: { canonical: `/jobs/${job.slug}` }');
    expect(jobPage).not.toContain("canonical: job.canonical_url");
  });

  it("publishes site identity and accurate sitemap date sources", () => {
    const layout = read("src/app/layout.tsx");
    const sitemap = read("src/app/sitemap.ts");
    expect(layout).toContain('\"@type\": \"Organization\"');
    expect(layout).toContain('\"@type\": \"WebSite\"');
    expect(sitemap).toContain("siteContentUpdatedIso");
    expect(sitemap).toContain("rulesVerifiedIso");
    expect(sitemap).toContain("legalContentUpdatedIso");
  });

  it("publishes Article structured data on the calculation methodology", () => {
    const structuredData = read("src/components/article-structured-data.tsx");
    expect(structuredData).toContain('"@type": "Article"');
    expect(structuredData).toContain("mainEntityOfPage");
    expect(structuredData).toContain("dateModified");
    expect(structuredData).toContain("founderLinkedInUrl");
    expect(structuredData).toContain("founderGitHubUrl");

    for (const route of [
      "src/app/how-paye-is-calculated/page.tsx",
    ]) {
      expect(read(route)).toContain("<ArticleStructuredData");
    }
  });
});
