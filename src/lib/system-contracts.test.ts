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
    expect(legalContentUpdatedDate).toBe("8 August 2026");
    expect(consumers).not.toContain("29 July 2026");
    expect(consumers).not.toContain("8 August 2026");
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

  it("keeps the funded salary pilot bounded and job sourcing separate", () => {
    const page = read("src/components/contributor-program.tsx");
    const jobPage = read("src/app/contributors/job-sourcing/page.tsx");
    const migration = read("supabase/migrations/202608120003_activate_salary_report_pilot.sql");
    const rewardIncrease = read("supabase/migrations/202608190001_raise_salary_report_pilot_reward.sql");
    expect(page).toContain("Get ₦1,000");
    expect(page).toContain("first 20 approved reports");
    expect(jobPage).toContain("Reward TBD");
    expect(migration).toContain("target_approved=20");
    expect(migration).toContain("budget_kobo=1000000");
    expect(migration).toContain("Minimum payout is NGN 500");
    expect(rewardIncrease).toContain("reward_kobo = 100000");
    expect(rewardIncrease).toContain("budget_kobo = 2000000");
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
