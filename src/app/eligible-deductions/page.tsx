import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";
import { PayeGuideTrail } from "@/components/paye-guide-trail";

export const metadata: Metadata = {
  title: "Nigeria PAYE Eligible Deductions 2026",
  description: "Find the pension, NHF, NHIS, mortgage interest, life assurance and rent figures to enter in your Nigerian PAYE estimate.",
  alternates: { canonical: "/eligible-deductions" },
};

const deductions = [
  { id: "pension", name: "Pension", source: "Payslip or PFA statement", enter: "The amount deducted from your salary", avoid: "Your total retirement-account balance", example: "₦40,000 monthly equals ₦480,000 yearly." },
  { id: "nhf", name: "National Housing Fund (NHF)", source: "Payslip", enter: "The NHF amount actually deducted", avoid: "An assumed amount when NHF is not shown", example: "If it is not listed, leave the field at ₦0." },
  { id: "nhis", name: "NHIS or NHIA", source: "Payslip or payroll record", enter: "The eligible health-insurance contribution", avoid: "An ordinary private HMO payment unless confirmed", example: "Check with payroll when eligibility is unclear." },
  { id: "mortgage-interest", name: "Mortgage interest", source: "Lender statement", enter: "Interest on a qualifying mortgage for your main home", avoid: "The full payment, loan principal, rent or investment property", example: "Use only the interest amount shown by your lender." },
  { id: "life-assurance", name: "Life assurance", source: "Insurer receipt or statement", enter: "Qualifying premiums for you or your spouse", avoid: "Car, travel or ordinary health insurance", example: "Use the premium amount you can document." },
  { id: "rent-relief", name: "Rent for your home", source: "Tenancy record or rent receipt", enter: "The rent you actually pay for your home", avoid: "The calculated relief amount", example: "SalarySabi calculates the relief automatically." },
];

export default function DeductionsPage() {
  return <PublicPageShell>
    <PayeGuideTrail current="deductions" />
    <article className="deductions-guide-page">
      <header className="deductions-guide-hero"><span className="eyebrow">What can reduce your PAYE?</span><h1>Know which deductions count.</h1><p>See where to find each figure, what to enter, and what to leave out.</p></header>
      <nav className="deductions-jump-list" aria-label="Jump to a deduction"><strong>Jump to</strong>{deductions.map((item, index) => <a href={`#${item.id}`} key={item.id}><span>{String(index + 1).padStart(2, "0")}</span>{item.name}</a>)}</nav>
      <section className="deductions-reference" aria-labelledby="reference-title">
        <div className="deductions-reference-heading"><div><span className="eyebrow">Check before you enter</span><h2 id="reference-title">What belongs in the calculator</h2></div><p>If an item does not apply to you, leave it at ₦0.</p></div>
        <div className="deductions-table-heading" aria-hidden="true"><span>Deduction and source</span><span>Enter this</span><span>Do not enter this</span></div>
        {deductions.map((item, index) => <article className="deduction-reference-row" id={item.id} key={item.id}><div className="deduction-reference-name"><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item.name}</h3><small>{item.source}</small></div></div><div data-label="Enter this"><p>{item.enter}</p><small>{item.example}</small></div><div data-label="Do not enter this"><p>{item.avoid}</p></div></article>)}
      </section>
      <section className="deductions-records"><div><span className="eyebrow">Records to keep</span><h2>Use amounts you can confirm</h2></div><p>Keep the payslip, statement or receipt supporting every figure. SalarySabi provides an estimate; your employer or tax adviser can confirm whether a deduction applies to your circumstances.</p></section>
      <section className="deductions-next-step"><div><span className="eyebrow">Ready?</span><h2>Go back and calculate your PAYE</h2><p>Your figures stay in this browser. SalarySabi will return you to the field you were checking.</p></div><div><Link className="primary-button" href="/?restore=deduction#calculator">Back to my calculation</Link><Link className="secondary-button" href="/how-paye-is-calculated">See how PAYE is calculated</Link></div></section>
    </article>
  </PublicPageShell>;
}
