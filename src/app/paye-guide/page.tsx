import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Nigeria PAYE Guide 2026 | SalarySabi",
  description: "Understand how Nigerian PAYE is calculated, which deductions you can enter and how the 2026 tax bands apply.",
  alternates: { canonical: "/paye-guide" },
};

const guides = [
  { number: "01", eyebrow: "Start here", title: "How PAYE is calculated", description: "Follow employment income through deductions, chargeable income, graduated bands and monthly PAYE.", answer: "How did SalarySabi get this number?", href: "/how-paye-is-calculated", action: "Follow the calculation" },
  { number: "02", eyebrow: "Calculator inputs", title: "Eligible deductions", description: "See which pension, housing, health, mortgage, insurance and rent figures belong in the calculator.", answer: "What amount should I enter?", href: "/eligible-deductions", action: "Check eligible deductions" },
  { number: "03", eyebrow: "Rates and thresholds", title: "Nigeria's 2026 tax bands", description: "Understand marginal rates and see the portion of chargeable income taxed inside each band.", answer: "Which rate applies to my income?", href: "/tax-bands", action: "View the tax bands" },
];

export default function PayeGuidePage() {
  return (
    <PublicPageShell>
      <article className="paye-guide-page">
        <header className="paye-guide-hero">
          <div><span className="eyebrow">PAYE, explained plainly</span><h1>Know where every PAYE number comes from.</h1><p>See the calculation. Check what to enter. Understand the rate that applies.</p></div>
          <Link className="primary-button" href="/#calculator">Calculate my PAYE</Link>
        </header>
        <section className="paye-guide-map" aria-labelledby="guide-map-title">
          <div className="paye-guide-map-heading"><span className="eyebrow">What do you need?</span><h2 id="guide-map-title">Pick the guide that answers it</h2></div>
          <div className="paye-guide-cards">
            {guides.map((guide) => (
              <article className={guide.number === "01" ? "paye-guide-card is-primary" : "paye-guide-card"} key={guide.href}>
                <span className="paye-guide-card-number">{guide.number}</span>
                <div><span className="eyebrow">{guide.eyebrow}</span><h3>{guide.title}</h3><p>{guide.description}</p></div>
                <dl><dt>Answers</dt><dd>{guide.answer}</dd></dl>
                <Link href={guide.href}>{guide.action}<span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        </section>
        <section className="paye-guide-sequence" aria-labelledby="guide-sequence-title">
          <div><span className="eyebrow">A simple way to check</span><h2 id="guide-sequence-title">Calculate. Confirm. Understand.</h2></div>
          <ol>
            <li><span>01</span><strong>Calculate</strong><p>Enter salary and deductions you can confirm.</p></li>
            <li><span>02</span><strong>Check inputs</strong><p>Use the deductions guide for uncertain fields.</p></li>
            <li><span>03</span><strong>Understand the result</strong><p>Follow the method and inspect each tax band.</p></li>
          </ol>
        </section>
        <section className="paye-guide-faq" aria-labelledby="paye-faq-title">
          <div className="paye-guide-faq-heading">
            <span className="eyebrow">Common PAYE questions</span>
            <h2 id="paye-faq-title">Quick answers. Official rules linked.</h2>
          </div>
          <div className="paye-guide-faq-list">
            <article>
              <h3>How do I calculate PAYE in Nigeria in 2026?</h3>
              <p>Convert employment income to an annual amount, subtract eligible deductions and rent relief, apply the graduated tax bands, then divide annual PAYE by 12 for a regular monthly estimate.</p>
              <Link href="/how-paye-is-calculated">Follow the full PAYE calculation</Link>
            </article>
            <article>
              <h3>What are Nigeria&apos;s PAYE tax bands for 2026?</h3>
              <p>The first ₦800,000 of chargeable income is taxed at 0%. Higher portions move through the 15%, 18%, 21%, 23% and 25% bands. A higher rate does not apply to all your income.</p>
              <Link href="/tax-bands">See every band and a worked example</Link>
            </article>
            <article>
              <h3>Is minimum wage taxed in Nigeria?</h3>
              <p>Employment income at or below the current national minimum wage of ₦70,000 monthly, or ₦840,000 yearly, is treated as exempt under SalarySabi&apos;s 2026 ruleset.</p>
              <Link href="/how-paye-is-calculated#special-rules">Check the exemption and official source</Link>
            </article>
            <article>
              <h3>How do I calculate gross salary to net salary in Nigeria?</h3>
              <p>Start with gross pay, subtract PAYE and the deductions that apply to you, such as pension, NHF or NHIS. SalarySabi estimates PAYE separately so you can see what changes your take-home pay.</p>
              <Link href="/payslip-checker">Compare the figures on your payslip</Link>
            </article>
          </div>
          <p className="paye-guide-faq-note">These are educational estimates, not personal tax advice. Check unusual pay arrangements with the relevant revenue authority or a qualified Nigerian tax professional.</p>
        </section>
        <section className="paye-guide-actions">
          <div><span className="eyebrow">Have your figures ready?</span><h2>Calculate your PAYE. Check the details when you need them.</h2></div>
          <div><Link className="primary-button" href="/#calculator">Open the PAYE calculator</Link><Link className="secondary-button" href="/payslip-checker">Check a payslip</Link></div>
        </section>
      </article>
    </PublicPageShell>
  );
}
