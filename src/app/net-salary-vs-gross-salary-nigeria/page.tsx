import type { Metadata } from "next";
import Link from "next/link";
import { ArticleStructuredData } from "@/components/article-structured-data";
import { PublicPageShell } from "@/components/info-page";
import { PayeGuideTrail } from "@/components/paye-guide-trail";
import { pitGuidelinesUrl, taxActUrl } from "@/lib/site";
import { salaryTerms } from "@/lib/salary-terms";

export const metadata: Metadata = {
  title: "Gross Salary vs Take-Home Pay in Nigeria",
  description: "See the difference between gross salary and take-home pay and which deductions reduce the amount you receive.",
  alternates: { canonical: "/net-salary-vs-gross-salary-nigeria" },
};

const steps = ["Start with gross salary", "Calculate PAYE", "Subtract pension, NHF and health insurance", "Subtract loans or other payroll deductions"];

export default function NetSalaryGuidePage() {
  return <PublicPageShell>
    <ArticleStructuredData headline="Gross Salary vs Take-Home Pay in Nigeria" description="See the difference between gross salary and take-home pay." path="/net-salary-vs-gross-salary-nigeria" about={["Gross salary", "Take-home pay", "PAYE"]} />
    <PayeGuideTrail current="gross-net" />
    <article className="simple-guide salary-article">
      <header className="simple-guide-hero"><span className="eyebrow">Salary explained</span><h1>Gross pay vs take-home pay</h1><p>Gross pay is your salary before deductions. Take-home pay is what remains after deductions.</p><Link className="primary-button" href="/payslip-checker">Calculate take-home pay</Link></header>

      <section className="simple-definition-grid" aria-label="Gross and take-home pay definitions"><article><span>Gross pay</span><h2>Before deductions</h2><p>{salaryTerms.grossSalary}</p></article><article><span>Take-home pay</span><h2>After deductions</h2><p>{salaryTerms.netSalary}</p></article></section>

      <aside className="simple-formula"><strong>Take-home pay</strong><span>= Gross pay − PAYE − other deductions</span></aside>

      <section className="simple-guide-section" aria-labelledby="gross-net-steps"><h2 id="gross-net-steps">How gross pay becomes take-home pay</h2><ol className="simple-step-list compact">{steps.map((step, index) => <li key={step}><span>{index + 1}</span><div><h3>{step}</h3></div></li>)}</ol></section>

      <section className="simple-guide-section" aria-labelledby="common-deductions"><h2 id="common-deductions">Common deductions</h2><div className="simple-chip-list"><span>PAYE</span><span>Pension</span><span>NHF</span><span>Health insurance</span><span>Loans and other deductions</span></div><p>Not every payslip deduction reduces PAYE. Use only eligible amounts in a PAYE calculation.</p><Link className="simple-guide-inline-link" href="/eligible-deductions">See which deductions count</Link></section>

      <details className="simple-guide-details"><summary>Official sources</summary><div><p><a href={taxActUrl} rel="noreferrer" target="_blank">Nigeria Tax Act 2025 ↗</a><br /><a href={pitGuidelinesUrl} rel="noreferrer" target="_blank">JRB Personal Income Tax Guidelines 2026 ↗</a></p></div></details>
    </article>
  </PublicPageShell>;
}
