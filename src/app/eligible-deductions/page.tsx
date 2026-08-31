import type { Metadata } from "next";
import Link from "next/link";
import { ArticleStructuredData } from "@/components/article-structured-data";
import { PublicPageShell } from "@/components/info-page";
import { PayeGuideTrail } from "@/components/paye-guide-trail";

export const metadata: Metadata = {
  title: "Nigeria PAYE Eligible Deductions 2026",
  description: "See which confirmed amounts belong in a Nigerian PAYE estimate.",
  alternates: { canonical: "/eligible-deductions" },
};

const deductions = [
  ["Pension", "Payslip or PFA statement", "Amount deducted from your salary", "Not your pension balance"],
  ["National Housing Fund (NHF)", "Payslip", "NHF amount actually deducted", "Leave at ₦0 if it is not shown"],
  ["NHIS or NHIA", "Payslip or payroll record", "Eligible health-insurance contribution", "Not an ordinary private HMO payment"],
  ["Mortgage interest", "Lender statement", "Interest on a qualifying mortgage for your home", "Not the full mortgage payment"],
  ["Life assurance", "Insurer statement", "Qualifying premium for you or your spouse", "Not car, travel or health insurance"],
  ["Home rent", "Rent receipt or tenancy record", "Rent you actually pay for your home", "SalarySabi calculates the relief"],
] as const;

export default function DeductionsPage() {
  return <PublicPageShell>
    <ArticleStructuredData headline="Nigeria PAYE Eligible Deductions 2026" description="See which confirmed amounts belong in a Nigerian PAYE estimate." path="/eligible-deductions" about={["PAYE deductions", "Pension", "Rent relief"]} />
    <PayeGuideTrail current="deductions" />
    <article className="deductions-guide-page simple-guide">
      <header className="simple-guide-hero"><span className="eyebrow">Eligible deductions</span><h1>What can reduce your PAYE?</h1><p>Use only amounts you can confirm. Leave anything else at ₦0.</p></header>
      <section className="simple-guide-section" aria-labelledby="deduction-list-title">
        <h2 id="deduction-list-title">Check each amount</h2>
        <div className="simple-deduction-list">
          {deductions.map(([name, source, enter, avoid]) => <article key={name}><div><h3>{name}</h3><small>Find it on: {source}</small></div><p><strong>Enter:</strong> {enter}</p><p><strong>Do not enter:</strong> {avoid}</p></article>)}
        </div>
      </section>
      <aside className="simple-guide-note"><strong>Keep your records.</strong><span>Keep the payslip, statement or receipt supporting every amount.</span></aside>
      <div className="simple-guide-actions"><Link className="primary-button" href="/payslip-checker">Back to my pay check</Link><Link href="/how-paye-is-calculated">How PAYE is calculated</Link></div>
    </article>
  </PublicPageShell>;
}
