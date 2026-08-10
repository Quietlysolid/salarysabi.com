import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { rulesetVersion } from "@/lib/site";

export const metadata: Metadata = {
  title: "PAYE Assumptions and Limits | SalarySabi",
  description: "Assumptions, rounding rules, edge cases and unsupported circumstances in SalarySabi ruleset 2026.1.",
  alternates: { canonical: "/calculation-notes" },
};

const notes = [
  ["Annualisation", "A monthly salary is multiplied by 12. Annual mode uses the amount entered directly. The calculator does not infer bonuses, a thirteenth-month payment or months with different earnings."],
  ["Monthly PAYE", "Annual PAYE is divided by 12. This is an estimate for regular monthly pay, not a payroll instruction for irregular or non-periodic payments."],
  ["Rounding", "Calculations use JavaScript numeric precision. Displayed naira amounts are rounded for readability, while exports show two decimal places."],
  ["Eligible deductions", "Only positive amounts entered for pension, NHF, NHIS, qualifying mortgage interest and life assurance are included. SalarySabi does not verify documents or eligibility."],
  ["Rent relief", "The calculator uses 20% of annual rent entered, capped at ₦500,000. It does not collect the tenancy and landlord information a revenue authority may require."],
  ["Minimum wage", "Annual employment income at or below ₦840,000 is treated as exempt under the calculator's 2026 ruleset."],
];

const unsupported = ["Benefits in kind, accommodation valuation and employer-provided assets", "Arrears, bonuses, commissions and other non-periodic payments", "Multiple employers or combined income from employment, business, rent, investments or digital assets", "Part-year employment, joining or leaving during the year", "Non-resident, expatriate or cross-border tax circumstances", "Tax credits, prior PAYE, refunds, penalties, filing and remittance obligations", "State-specific administrative practices or payroll adjustments"];

export default function CalculationNotesPage() {
  return <InfoPage eyebrow={`Ruleset ${rulesetVersion}`} title="Know what the calculator covers." intro="Some pay situations need more than a standard estimate. Check the assumptions and unsupported cases below.">
    <div className="trust-page">
      <section className="trust-section"><div className="trust-heading"><span className="eyebrow">Built-in assumptions</span><h2>How SalarySabi treats your entries</h2></div><dl className="assumption-list">{notes.map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}</dl></section>
      <section className="trust-section"><div className="trust-heading"><span className="eyebrow">Unsupported cases</span><h2>Ask a professional when pay is not straightforward.</h2><p>The current calculator does not fully model:</p></div><ul className="unsupported-list">{unsupported.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section className="trust-section trust-contact"><div><span className="eyebrow">Need the formula?</span><h2>See every step and source.</h2></div><Link className="primary-button" href="/how-paye-is-calculated">Open the calculation method</Link></section>
    </div>
  </InfoPage>;
}
