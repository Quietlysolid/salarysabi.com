import Link from "next/link";
import { Calculator } from "@/components/calculator";
import { PublicPageShell } from "@/components/info-page";
import { rulesVerifiedDate, siteUrl } from "@/lib/site";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SalarySabi Nigeria PAYE Calculator 2026",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: siteUrl,
    offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" },
    description: "A free Nigerian PAYE calculator using the Nigeria Tax Act 2025 and JRB Personal Income Tax Guidelines 2026.",
  };

  return (
    <PublicPageShell>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} type="application/ld+json" />

      <article className="guided-home">
        <header className="guided-home-hero">
          <span className="eyebrow">Nigeria PAYE calculator</span>
          <h1>Know your PAYE. No guesswork.</h1>
          <p>Calculate your 2026 PAYE and see how every tax band and deduction affects the result.</p>
          <div className="guided-home-actions">
            <a className="primary-button" href="#calculator">Calculate my PAYE</a>
            <Link className="guided-method-link" href="/how-paye-is-calculated">See how PAYE works <span aria-hidden="true">→</span></Link>
          </div>
        </header>

        <nav className="guided-stages" aria-label="SalarySabi pay tools">
          <a className="active" aria-current="step" href="#calculator"><span>01</span><strong>Calculate PAYE</strong><small>Estimate the tax on your salary</small></a>
          <Link href="/payslip-checker"><span>02</span><strong>Check the payslip</strong><small>Compare your PAYE and deductions</small></Link>
          <Link href="/how-paye-is-calculated"><span>03</span><strong>Understand the result</strong><small>See how your PAYE is calculated</small></Link>
        </nav>

        <section className="guided-workspace" id="calculator" aria-label="PAYE calculator and guidance">
          <div className="guided-calculator"><Calculator guided /></div>
          <aside className="guided-explainer">
            <span className="eyebrow">Know the numbers</span>
            <h2>No guesswork. See how it adds up.</h2>
            <p>Check any figure. Read the rule behind it.</p>
            <nav aria-label="PAYE calculation guides">
              <Link href="/how-paye-is-calculated#worked-example"><span>01</span><div><strong>Worked example</strong><small>See the calculation from start to finish.</small></div><b>See example</b></Link>
              <Link href="/how-paye-is-calculated#calculation-ledger"><span>02</span><div><strong>Full calculation</strong><small>Follow the numbers through to monthly PAYE.</small></div><b>See calculation</b></Link>
              <Link href="/tax-bands"><span>03</span><div><strong>Key rules and tax bands</strong><small>See the graduated rates and minimum-wage rule.</small></div><b>View tax bands</b></Link>
              <Link href="/eligible-deductions"><span>04</span><div><strong>Eligible deductions</strong><small>Know what to enter and what to leave out.</small></div><b>View deductions</b></Link>
            </nav>
          </aside>
        </section>

        <aside className="guided-assurance" aria-label="Calculator assurance">
          <strong>Your figures are private. The tax rules are current.</strong>
          <span>Your figures stay in this browser. Rules checked {rulesVerifiedDate}.</span>
          <Link href="/how-paye-is-calculated">See how we calculate</Link>
        </aside>

        <aside className="guided-builder-note" aria-label="About the builder">
          <span>Built independently by <Link href="/about">Ozichi Nwosu</Link>, a Nigerian software engineer who wanted PAYE to make sense.</span>
        </aside>

        <aside className="guided-secondary-product" aria-label="Salary-listed jobs">
          <div><span className="eyebrow">Also on SalarySabi</span><h2>Looking for work? See jobs that publish pay.</h2></div>
          <Link href="/jobs">Browse jobs with salaries</Link>
        </aside>
      </article>

    </PublicPageShell>
  );
}
