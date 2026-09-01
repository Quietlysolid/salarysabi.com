import type { Metadata } from "next";
import Link from "next/link";
import { ArticleStructuredData } from "@/components/article-structured-data";
import { PublicPageShell } from "@/components/info-page";
import { PayeGuideTrail } from "@/components/paye-guide-trail";
import { calculatePaye } from "@/lib/paye";
import { pitGuidelinesUrl, rulesetVersion, taxActUrl, taxProfessionalReviewIso } from "@/lib/site";

export const metadata: Metadata = {
  title: "How PAYE Is Calculated in Nigeria (2026 Guide)",
  description: "See how annual pay becomes monthly Nigerian PAYE, with five clear steps and a worked example.",
  alternates: { canonical: "/how-paye-is-calculated" },
};

const example = calculatePaye({ annualGrossIncome: 2_400_000 });
const exampleBands = example.bands.filter((band) => band.taxableAmount > 0);
const naira = (value: number) => `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value)}`;

export default function MethodologyPage() {
  return (
    <PublicPageShell>
      <ArticleStructuredData
        headline="How PAYE Is Calculated in Nigeria"
        description="See how annual pay becomes monthly Nigerian PAYE in five clear steps."
        path="/how-paye-is-calculated"
        about={["PAYE", "Nigerian personal income tax"]}
      />

      <article className="methodology-page simple-guide methodology-story">
        <header className="simple-guide-hero methodology-story-hero">
          <span className="eyebrow">PAYE, explained</span>
          <h1>Your PAYE. Five clear steps.</h1>
          <p>See how your annual pay becomes the tax on your payslip.</p>
          <Link className="primary-button" href="/payslip-checker">Check my PAYE</Link>
          <p className="methodology-trust-line" aria-label={`Independently reviewed 1 September 2026. Ruleset ${rulesetVersion}.`}>
            <strong>Independently reviewed</strong>
            <span aria-hidden="true">·</span>
            <time dateTime={taxProfessionalReviewIso}>1 September 2026</time>
            <span aria-hidden="true">·</span>
            <span>Ruleset {rulesetVersion}</span>
          </p>
        </header>

        <PayeGuideTrail compactOnMobile current="methodology" />

        <section className="methodology-equation" aria-labelledby="equation-title">
          <div className="methodology-equation-heading">
            <span className="eyebrow">The calculation</span>
            <h2 id="equation-title">From annual pay to monthly PAYE</h2>
          </div>
          <div
            className="methodology-equation-visual"
            role="img"
            aria-label="Step 1, find yearly pay. Step 2, subtract eligible deductions. Step 3, find taxable income. Step 4, apply tax bands. Step 5, divide yearly PAYE by 12 to find monthly PAYE."
          >
            <div>
              <span><small>1</small>Yearly pay</span>
              <b aria-hidden="true">−</b>
              <span><small>2</small>Eligible deductions</span>
              <b aria-hidden="true">=</b>
              <span><small>3</small>Taxable income</span>
            </div>
            <div>
              <span><small>4</small>Apply tax bands</span>
              <b aria-hidden="true">→</b>
              <span className="methodology-equation-output">Yearly PAYE</span>
              <b aria-hidden="true">÷ 12 =</b>
              <span><small>5</small>Monthly PAYE</span>
            </div>
          </div>
        </section>

        <section className="simple-guide-section methodology-worked-example" aria-labelledby="example-title">
          <header>
            <span className="eyebrow">Worked example</span>
            <h2 id="example-title">See it with ₦2.4 million</h2>
            <p>No deductions are entered. Every figure below comes from the same PAYE engine used by SalarySabi.</p>
          </header>

          <div className="methodology-example-grid">
            <div className="methodology-example-math">
              <dl className="methodology-example-inputs">
                <div><dt>Yearly pay</dt><dd>{naira(example.annualGrossIncome)}</dd></div>
                <div><dt>Eligible deductions</dt><dd>{naira(example.totalEligibleDeductions)}</dd></div>
                <div><dt>Taxable income</dt><dd>{naira(example.chargeableIncome)}</dd></div>
              </dl>

              <div className="methodology-band-breakdown" aria-label="Tax band breakdown">
                <span>Apply the tax bands</span>
                <dl>
                  {exampleBands.map((band) => (
                    <div key={`${band.rate}-${band.taxableAmount}`}>
                      <dt>{naira(band.taxableAmount)} taxed at {band.rate * 100}%</dt>
                      <dd>{naira(band.tax)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <aside className="methodology-example-result" aria-label="Worked example result">
              <span>Yearly PAYE</span>
              <strong>{naira(example.annualTax)}</strong>
              <div><span>Divide by 12</span><b aria-hidden="true">÷</b></div>
              <span>Monthly PAYE</span>
              <strong>{naira(example.monthlyTax)}</strong>
            </aside>
          </div>
        </section>

        <details className="simple-guide-details methodology-source-details" id="sources">
          <summary>Verify the rules and sources</summary>
          <div>
            <p>The first ₦800,000 of taxable income is taxed at 0%. Higher rates apply only to the portion inside each later band. Employment income at or below the national minimum wage may be exempt.</p>
            <p><Link href="/eligible-deductions">See eligible deductions</Link><span aria-hidden="true"> · </span><Link href="/tax-bands">See all tax bands</Link></p>
            <p><a className="methodology-evidence-row" href={taxActUrl} rel="noreferrer" target="_blank">Nigeria Tax Act 2025 ↗</a><br /><a href={pitGuidelinesUrl} rel="noreferrer" target="_blank">JRB Personal Income Tax Guidelines 2026 ↗</a></p>
          </div>
        </details>
      </article>
    </PublicPageShell>
  );
}
