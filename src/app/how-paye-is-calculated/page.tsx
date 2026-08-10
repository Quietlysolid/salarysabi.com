import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";
import { PayeGuideTrail } from "@/components/paye-guide-trail";

export const metadata: Metadata = {
  title: "How Nigerian PAYE Is Calculated in 2026",
  description: "Follow SalarySabi's annual PAYE method from employment income through eligible deductions, tax bands and monthly PAYE.",
  alternates: { canonical: "/how-paye-is-calculated" },
};

const ledger = [
  ["01", "Total annual emolument", "Monthly employment income is multiplied by 12. Annual mode uses the annual amount entered directly.", "₦2,400,000"],
  ["02", "Subtract eligible deductions", "SalarySabi subtracts only the actual annual pension, NHF, NHIS, qualifying mortgage interest and life-assurance amounts you provide, plus calculated rent relief.", "Amounts you confirm"],
  ["03", "Find chargeable income", "Chargeable income is the annual emolument remaining after eligible deductions and rent relief are subtracted.", "Income less deductions"],
  ["04", "Apply graduated tax bands", "Each rate applies only to the portion of chargeable income inside that band. The first ₦800,000 is taxed at 0%.", "Band by band"],
  ["05", "Calculate annual PAYE", "The tax calculated inside every applicable band is added together to produce annual PAYE.", "₦240,000"],
  ["06", "Divide annual PAYE by 12", "Monthly PAYE is annual PAYE divided by 12. Displayed naira amounts are rounded for readability.", "₦20,000 monthly"],
];

export default function MethodologyPage() {
  return <PublicPageShell>
    <PayeGuideTrail current="methodology" />
    <article className="methodology-page">
      <header className="methodology-hero">
        <div><span className="eyebrow">How the numbers work</span><h1>How Nigerian PAYE is calculated in 2026</h1><p>Follow the calculation from annual employment income to monthly PAYE. For the figures to copy from your payslip, use the deductions guide.</p></div>
        <Link className="primary-button" href="/#calculator">Calculate my PAYE</Link>
      </header>
      <nav className="methodology-contents" aria-label="On this page"><strong>On this page</strong><a href="#worked-example">Worked example</a><a href="#calculation-ledger">Full calculation</a><a href="#special-rules">Special rules</a><a href="#sources">Sources</a></nav>
      <section className="methodology-workspace" id="worked-example">
        <div className="methodology-main">
          <div className="methodology-section-heading"><span className="eyebrow">Worked example</span><h2>See how the numbers add up</h2><p>The official JRB example starts with ₦2.4 million annual emolument and produces ₦240,000 annual PAYE, or ₦20,000 monthly.</p></div>
          <ol className="calculation-ledger" id="calculation-ledger">
            {ledger.map(([number, title, explanation, example]) => <li key={number}><span className="ledger-number">{number}</span><div><h3>{title}</h3><p>{explanation}</p>{number === "02" && <Link href="/eligible-deductions">Understand eligible deductions</Link>}</div><strong>{example}</strong></li>)}
          </ol>
        </div>
        <aside className="methodology-rules" id="special-rules">
          <div><span className="eyebrow">Key rule</span><h2>First ₦800,000</h2><strong>Taxed at 0%</strong><p>The rate applies only to income inside that band.</p><Link href="/tax-bands">View complete 2026 tax bands</Link></div>
          <div><span className="eyebrow">Rent relief</span><h2>Lower of</h2><strong>20% × annual rent paid</strong><p>or ₦500,000 per year.</p><Link href="/eligible-deductions#rent-relief">What amount should I enter?</Link></div>
          <div><span className="eyebrow">Minimum-wage exemption</span><h2>₦70,000 monthly</h2><strong>₦840,000 per year</strong><p>Employment income at or below the national minimum wage is exempt before graduated bands are applied.</p></div>
        </aside>
      </section>
      <section className="methodology-evidence" id="sources">
        <div><span className="eyebrow">Sources and verification</span><h2>The rules behind the estimate</h2></div>
        <a className="methodology-evidence-row" href="https://www.jrb.gov.ng/policies-reforms" rel="noreferrer" target="_blank"><span>01</span><strong>Nigeria Tax Act 2025</strong><small>Joint Revenue Board policy archive · Chapter Two · Open official record ↗</small></a>
        <a className="methodology-evidence-row" href="https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf" rel="noreferrer" target="_blank"><span>02</span><strong>JRB Personal Income Tax Guidelines 2026</strong><small>Issued 24 February 2026 · Open official PDF ↗</small></a>
        <div className="methodology-citations"><h3>Rule references used by SalarySabi</h3><ul><li><strong>Eligible deductions:</strong> JRB Guidelines, paragraph 8, page 6.</li><li><strong>Rent relief:</strong> JRB Guidelines, paragraph 9, pages 6–7.</li><li><strong>Tax bands and PAYE template:</strong> JRB Guidelines, Appendix 1, pages 12–13.</li><li><strong>Minimum-wage exemption:</strong> Nigeria Tax Act 2025, section 163(1)(t); JRB Guidelines, Appendix 4, page 18.</li><li><strong>Commencement:</strong> 1 January 2026, confirmed in the <a href="https://www.jrb.gov.ng/assets/2024-2025-jtb-year-book-CEV7rILW.pdf" rel="noreferrer" target="_blank">official JTB/JRB 2024–2025 Year Book ↗</a>.</li></ul><p><Link href="/calculation-notes">Read assumptions and unsupported cases</Link></p></div>
        <p>SalarySabi provides an estimate. Confirm filing and remittance obligations with the relevant tax authority or a qualified Nigerian tax professional.</p>
        <div className="methodology-actions"><Link className="primary-button" href="/#calculator">Try your own salary</Link><Link className="secondary-button" href="/tax-updates">See tax updates</Link></div>
      </section>
    </article>
  </PublicPageShell>;
}
