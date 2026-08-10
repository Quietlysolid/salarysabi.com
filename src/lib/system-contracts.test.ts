import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { legalContentUpdatedDate, rulesVerifiedDate } from "./site";

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
    for (const route of ["src/app/page.tsx", "src/app/jobs/page.tsx", "src/app/payslip-checker/page.tsx", "src/app/account/page.tsx", "src/app/post-a-job/page.tsx", "src/app/suggest-a-job/page.tsx", "src/app/paye-guide/page.tsx", "src/app/disclaimer/page.tsx", "src/app/privacy/page.tsx", "src/app/eligible-deductions/page.tsx", "src/app/how-paye-is-calculated/page.tsx"]) {
      expect(read(route)).toContain("PublicPageShell");
    }
  });

  it("uses one product-state contract for jobs and account states", () => {
    expect(read("src/components/job-board.tsx")).toContain("ProductState");
    expect(read("src/components/job-seeker-account.tsx")).toContain("ProductState");
  });

  it("keeps analytics events free of sensitive financial and credential properties", () => {
    const analytics = read("src/components/analytics.tsx");
    expect(analytics).toContain('autocapture: false');
    expect(analytics).toContain('disable_session_recording: true');
    expect(analytics).toContain('persistence: "memory"');
    expect(analytics).not.toMatch(/salary|deduction|password|payslip_value|email/i);
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
});
