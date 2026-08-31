import type { Metadata } from "next";
import Link from "next/link";
import { ArticleStructuredData } from "@/components/article-structured-data";
import { PublicPageShell } from "@/components/info-page";
import { PayeGuideTrail } from "@/components/paye-guide-trail";
import { taxActUrl } from "@/lib/site";
import { salaryTerms } from "@/lib/salary-terms";

export const metadata: Metadata = {
  title: "Nigeria Tax Bands 2026",
  description: "See Nigeria's 2026 PAYE rates and how each rate applies to only part of taxable income.",
  alternates: { canonical: "/tax-bands" },
};

const bands = [
  ["First ₦800,000", "0%", "₦0"],
  ["Next ₦2,200,000", "15%", "₦330,000"],
  ["Next ₦9,000,000", "18%", "₦1,620,000"],
  ["Next ₦13,000,000", "21%", "₦2,730,000"],
  ["Next ₦25,000,000", "23%", "₦5,750,000"],
  ["Above ₦50,000,000", "25%", "No maximum"],
] as const;

export default function TaxBandsPage() {
  return <PublicPageShell>
    <ArticleStructuredData headline="Nigeria Tax Bands 2026" description="See Nigeria's 2026 PAYE rates and how marginal bands work." path="/tax-bands" about={["Nigeria tax bands", "PAYE"]} />
    <PayeGuideTrail current="bands" />
    <article className="simple-guide tax-bands-page">
      <header className="simple-guide-hero"><span className="eyebrow">2026 PAYE rates</span><h1>Nigeria tax bands</h1><p>A higher rate applies only to the part of taxable income inside that band—not your whole salary.</p><Link className="primary-button" href="/payslip-checker">Calculate take-home pay</Link></header>

      <section className="simple-guide-section simple-example" aria-labelledby="band-example-title">
        <div><span className="eyebrow">Example</span><h2 id="band-example-title">₦6 million taxable income</h2><p>The income is split across three bands.</p></div>
        <dl><div><dt>First ₦800,000 at 0%</dt><dd>₦0</dd></div><div><dt>Next ₦2.2m at 15%</dt><dd>₦330,000</dd></div><div><dt>Remaining ₦3m at 18%</dt><dd>₦540,000</dd></div><div><dt>Total yearly PAYE</dt><dd>₦870,000</dd></div></dl>
      </section>

      <section className="simple-guide-section" aria-labelledby="band-table-title">
        <h2 id="band-table-title">2026 tax bands</h2>
        <div className="simple-band-table" role="table" aria-label="Nigeria 2026 personal income tax bands">
          <div role="row"><strong role="columnheader">Taxable income</strong><strong role="columnheader">Rate</strong><strong role="columnheader">Maximum tax in band</strong></div>
          {bands.map(([band, rate, maximum]) => <div role="row" key={band}><span role="cell">{band}</span><strong role="cell">{rate}</strong><span role="cell">{maximum}</span></div>)}
        </div>
      </section>

      <div className="simple-callout-grid"><aside><strong>Taxable income is not always gross salary.</strong><span>{salaryTerms.chargeableIncome}</span><Link href="/eligible-deductions">Check eligible deductions</Link></aside><aside><strong>Your top rate is not your average rate.</strong><span>Lower portions keep their lower rates.</span><Link href="/how-paye-is-calculated">See the five calculation steps</Link></aside></div>
      <details className="simple-guide-details"><summary>Official source</summary><div><p><a href={taxActUrl} rel="noreferrer" target="_blank">Nigeria Tax Act 2025 ↗</a></p></div></details>
    </article>
  </PublicPageShell>;
}
