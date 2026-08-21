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
      "src/components/calculator.tsx",
      "src/components/payslip-checker.tsx",
      "src/app/disclaimer/page.tsx",
      "src/app/privacy/page.tsx",
    ].map(read).join("\n");
    expect(rulesVerifiedDate).toBe("29 July 2026");
    expect(legalContentUpdatedDate).toBe("21 August 2026");
    expect(consumers).not.toContain("29 July 2026");
    expect(consumers).not.toContain("21 August 2026");
  });

  it("uses the public shell on core public routes", () => {
    for (const route of ["src/app/page.tsx", "src/app/jobs/page.tsx", "src/app/payslip-checker/page.tsx", "src/app/account/page.tsx", "src/app/post-a-job/page.tsx", "src/app/suggest-a-job/page.tsx", "src/app/paye-guide/page.tsx", "src/app/disclaimer/page.tsx", "src/app/privacy/page.tsx", "src/app/eligible-deductions/page.tsx", "src/app/how-paye-is-calculated/page.tsx", "src/app/salaries-and-jobs/page.tsx", "src/app/business/page.tsx"]) {
      expect(read(route)).toContain("PublicPageShell");
    }
  });

  it("uses one product-state contract for jobs and account states", () => {
    expect(read("src/components/job-board.tsx")).toContain("ProductState");
    expect(read("src/components/job-seeker-account.tsx")).toContain("ProductState");
  });

  it("keeps analytics events free of sensitive financial and credential properties", () => {
    const analytics = read("src/components/analytics.tsx");
    expect(analytics).toContain("analyticsOptOutKey");
    expect(analytics).toContain('process.env.NODE_ENV !== "production"');
    expect(analytics).toContain("window.location.pathname");
    expect(analytics).toContain("p_event_name: event");
    expect(analytics).toContain("p_page_path: pagePath");
    expect(analytics).toContain("p_referrer_host:");
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
    const grossNetGuide = read("src/app/net-salary-vs-gross-salary-nigeria/page.tsx");
    const taxBandsGuide = read("src/app/tax-bands/page.tsx");
    const payeGuide = read("src/app/how-paye-is-calculated/page.tsx");
    const calculator = read("src/components/calculator.tsx");

    expect(salaryTerms.grossSalary).toContain("before employee deductions");
    expect(salaryTerms.grossSalary).toContain("basic salary and taxable allowances");
    expect(salaryTerms.chargeableIncome).toContain("after eligible deductions and reliefs");
    expect(salaryTerms.netSalary).toContain("PAYE and every other applicable payroll deduction");
    expect(grossNetGuide).toContain("salaryTerms.grossSalary");
    expect(grossNetGuide).toContain("salaryTerms.netSalary");
    expect(taxBandsGuide).toContain("salaryTerms.chargeableIncome");
    expect(payeGuide).toContain("salaryTerms.chargeableIncome");
    expect(calculator).toContain("Taxable income");
  });

  it("keeps the analytics allow-list synchronized with the database migration", () => {
    const migration = read("supabase/migrations/202608070001_product_analytics.sql");
    for (const event of ["page_view", "paye_calculated", "payslip_checked", "account_signup_succeeded", "job_apply_clicked"]) {
      expect(migration).toContain(`'${event}'`);
    }
    expect(migration).toContain("is_current_user_admin()");
    expect(migration).toContain("from auth.users");
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
  });

  it("uses a native final i so the wordmark remains typographically connected", () => {
    const wordmark = read("src/components/brand-wordmark.tsx");
    expect(wordmark).toContain('<span className="brand-i">i</span>');
    expect(wordmark).not.toContain("ı");
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

  it("keeps both funded contributor pilots explicit and independently verified", () => {
    const page = read("src/components/contributor-program.tsx");
    const campaignSource = read("src/lib/active-contribution-campaigns.ts");
    const jobProgramme = read("src/components/job-scout-program.tsx");
    const jobForm = read("src/components/job-suggestion-form.tsx");
    const admin = read("src/components/admin-contributor-program.tsx");
    const safeguards = read("supabase/migrations/202608200003_connect_job_scout_campaign.sql");
    const migration = read("supabase/migrations/202608120003_activate_salary_report_pilot.sql");
    const rewardIncrease = read("supabase/migrations/202608190001_raise_salary_report_pilot_reward.sql");
    expect(campaignSource).toContain("campaign.budget_remaining_kobo >= campaign.reward_kobo");
    expect(page).toContain("Funded offers currently pay");
    expect(page).toContain("track every review decision");
    expect(page).toContain("Only one paid salary report is allowed per person");
    expect(page).toContain("/contributors/job-sourcing");
    expect(jobProgramme).toContain("Find a salary-transparent job");
    expect(jobProgramme).not.toContain("Reward TBD");
    expect(jobForm).toContain("item.slug === requested || item.id === requested");
    expect(jobForm).toContain("No reward claim was created");
    expect(admin).toContain("admin_set_contribution_campaign_status");
    expect(admin).toContain("Complete checks to approve");
    expect(safeguards).toContain("Closed campaigns cannot be reopened");
    expect(safeguards).toContain("Complete all four source checks");
    expect(safeguards).toContain("update public.salary_reports set approved = true");
    expect(migration).toContain("target_approved=20");
    expect(migration).toContain("budget_kobo=1000000");
    expect(migration).toContain("Minimum payout is NGN 500");
    expect(rewardIncrease).toContain("reward_kobo = 100000");
    expect(rewardIncrease).toContain("budget_kobo = 2000000");
  });

  it("gives contributors a private, abuse-resistant path from claim to payout", () => {
    const migration = read("supabase/migrations/202608210003_contributor_accounts.sql");
    const riskArrayFix = read("supabase/migrations/202608210005_fix_contributor_risk_array.sql");
    const lifecycleFix = read("supabase/migrations/202608210006_fix_reward_lifecycle_analytics.sql");
    const dashboard = read("src/components/contributor-dashboard.tsx");
    const terms = read("src/app/terms/page.tsx");
    expect(migration).toContain("function public.contributor_claim_history");
    expect(migration).toContain("available_to_request_kobo");
    expect(migration).toContain("add column if not exists payout_destination text");
    expect(migration).toContain("payout_destination is not null");
    expect(migration).toContain("payout_destination_fingerprint");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("payout destination is already linked to another contributor");
    expect(riskArrayFix).toContain("reasons text[] := '{}'::text[]");
    expect(lifecycleFix).toContain("lifecycle_event_name");
    expect(lifecycleFix).not.toContain("declare event_name text");
    for (const event of ["reward_submission_succeeded", "reward_claim_approved", "reward_claim_rejected", "reward_payout_requested", "reward_payout_completed"]) {
      expect(migration).toContain(`'${event}'`);
    }
    expect(dashboard).toContain("Rewards and review status");
    expect(dashboard).toContain("Review note");
    expect(dashboard).toContain("Pilot target: reviewed within 5 business days");
    expect(dashboard).toContain("Request a payout");
    expect(terms).toContain("Contributor rewards");
    expect(terms).toContain("ask for a review within 14 days");
  });

  it("separates rewarded submission, payment and benchmark publication", () => {
    const migration = read("supabase/migrations/202608210004_contributor_integrity.sql");
    const edge = read("supabase/functions/submit-rewarded-contribution/index.ts");
    const salaryForm = read("src/components/salary-benchmarks.tsx");
    const jobForm = read("src/components/job-suggestion-form.tsx");
    const admin = read("src/components/admin-contributor-program.tsx");
    expect(migration).toContain("service_submit_rewarded_salary_report");
    expect(migration).toContain("service_submit_rewarded_job_source");
    expect(migration).toContain("revoke all on function public.submit_rewarded_salary_report");
    expect(migration).toContain("publication_status='quarantined'");
    expect(migration).toContain("approved and publication_status='published'");
    expect(migration).toContain("admin_release_salary_report");
    expect(migration).toContain("available_at");
    expect(migration).toContain("contributor_admin_audit_log");
    expect(migration).toContain("purge_expired_contribution_risk_data");
    expect(edge).toContain("challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(edge).toContain("assertPublicHost");
    expect(edge).toContain("service_consume_contribution_rate_limit");
    expect(edge).toContain("RISK_FINGERPRINT_SECRET");
    expect(edge).toContain('"message" in error');
    expect(salaryForm).toContain("/functions/v1/submit-rewarded-contribution");
    expect(jobForm).toContain("/functions/v1/submit-rewarded-contribution");
    expect(salaryForm).not.toContain('functionName=campaignId?"submit_rewarded_salary_report"');
    expect(jobForm).not.toContain("/rest/v1/rpc/submit_rewarded_job_source");
    expect(admin).toContain("Benchmark quarantine");
    expect(admin).toContain("Protected risk review required");
  });

  it("makes funded contribution offers shareable and trackable", () => {
    const programme = read("src/components/contributor-program.tsx");
    const share = read("src/components/contributor-share.tsx");
    const navigation = read("src/components/site-navigation.tsx");
    expect(programme).toContain("ContributorShare");
    expect(share).toContain("Share on WhatsApp");
    expect(share).toContain('track("reward_offer_shared")');
    expect(navigation).toContain("My contributions");
  });

  it("keeps manual ATS imports admin-only and source-scoped", () => {
    const importer = read("supabase/functions/import-ats-jobs/index.ts");
    const dashboard = read("src/components/admin-dashboard.tsx");
    expect(importer).toContain("isAdminRequest");
    expect(importer).toContain('.from("admin_users")');
    expect(importer).toContain("adminAuthorized && !sourceId");
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

  it("keeps tax explainers source-backed and discoverable", () => {
    const article = read("src/app/tax-news/nigeria-tax-act-2025-paycheck-2026/page.tsx");
    const sitemap = read("src/app/sitemap.ts");
    expect(article).toContain('"@type": "Article"');
    expect(article).toContain("https://www.jrb.gov.ng/policies-reforms");
    expect(article).toContain("https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf");
    expect(article).toContain("No qualified tax professional has independently reviewed SalarySabi yet.");
    expect(sitemap).toContain("/tax-news/nigeria-tax-act-2025-paycheck-2026");
  });

  it("publishes Article structured data on every core PAYE guide", () => {
    const structuredData = read("src/components/article-structured-data.tsx");
    expect(structuredData).toContain('"@type": "Article"');
    expect(structuredData).toContain("mainEntityOfPage");
    expect(structuredData).toContain("dateModified");
    expect(structuredData).toContain("founderLinkedInUrl");
    expect(structuredData).toContain("founderGitHubUrl");

    for (const route of [
      "src/app/how-paye-is-calculated/page.tsx",
      "src/app/tax-bands/page.tsx",
      "src/app/eligible-deductions/page.tsx",
      "src/app/net-salary-vs-gross-salary-nigeria/page.tsx",
    ]) {
      expect(read(route)).toContain("<ArticleStructuredData");
    }
  });
});
