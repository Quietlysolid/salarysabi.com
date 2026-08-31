import type { Metadata } from "next";
import Link from "next/link";
import { ArticleStructuredData } from "@/components/article-structured-data";
import { PublicPageShell } from "@/components/info-page";
import { PayeGuideTrail } from "@/components/paye-guide-trail";
import { pitGuidelinesUrl, taxActUrl } from "@/lib/site";
import { salaryTerms } from "@/lib/salary-terms";

export const metadata: Metadata = {
  title: "How PAYE Is Calculated in Nigeria (2026 Guide)",
  description: "See the five steps used to estimate Nigerian PAYE, with a simple worked example.",
  alternates: { canonical: "/how-paye-is-calculated" },
};

const steps = [
  ["1", "Find yearly pay", "Multiply regular monthly gross pay by 12."],
  ["2", "Subtract eligible deductions", "Use only pension, NHF, health insurance, rent and other eligible amounts you can confirm."],
  ["4", "Apply each tax band", "Each rate applies only to the part of income inside that band."],
  ["5", "Find monthly PAYE", "Add the yearly tax, then divide it by 12."],
] as const;

export default function MethodologyPage() {
  return <PublicPageShell>
    <ArticleStructuredData headline="How PAYE Is Calculated in Nigeria" description="See the five steps used to estimate Nigerian PAYE." path="/how-paye-is-calculated" about={["PAYE", "Nigerian personal income tax"]} />
    <PayeGuideTrail current="methodology" />
    <article className="methodology-page simple-guide">
      <header className="simple-guide-hero">
        <span className="eyebrow">PAYE calculation</span>
        <h1>How PAYE is calculated</h1>
        <p>Yearly pay − eligible deductions = taxable income. Tax bands are then applied, and the yearly tax is divided by 12.</p>
        <Link className="primary-button" href="/payslip-checker">Calculate take-home pay</Link>
      </header>
      <section className="simple-guide-section" aria-labelledby="steps-title">
        <h2 id="steps-title">The five steps</h2>
        <ol className="simple-step-list">
          {steps.slice(0, 2).map(([number, title, text]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}
          <li><span>3</span><div><h3>Find taxable income</h3><p>{salaryTerms.chargeableIncome}</p></div></li>
          {steps.slice(2).map(([number, title, text]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}
        </ol>
      </section>
      <section className="simple-guide-section simple-example" aria-labelledby="example-title">
        <div><span className="eyebrow">Example</span><h2 id="example-title">₦2.4 million yearly pay</h2><p>With no deductions entered, the official example produces:</p></div>
        <dl><div><dt>Yearly PAYE</dt><dd>₦240,000</dd></div><div><dt>Monthly PAYE</dt><dd>₦20,000</dd></div></dl>
      </section>
      <details className="simple-guide-details"><summary>Important rules and official sources</summary><div><p>The first ₦800,000 of taxable income is taxed at 0%. Higher rates apply only to the portion inside each later band. Employment income at or below the national minimum wage may be exempt.</p><p><Link href="/eligible-deductions">See eligible deductions</Link> · <Link href="/tax-bands">See all tax bands</Link></p><p><a className="methodology-evidence-row" href={taxActUrl} rel="noreferrer" target="_blank">Nigeria Tax Act 2025 ↗</a><br /><a href={pitGuidelinesUrl} rel="noreferrer" target="_blank">JRB Personal Income Tax Guidelines 2026 ↗</a></p></div></details>
    </article>
  </PublicPageShell>;
}
