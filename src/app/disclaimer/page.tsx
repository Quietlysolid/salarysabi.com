import type { Metadata } from "next";
import Link from "next/link";
import { AlertOctagon, Calculator, FileText, MessageSquareText, Scale } from "lucide-react";
import { PublicPageShell } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Tax Calculator Disclaimer",
  description: "Important limitations and guidance for SalarySabi PAYE calculator estimates.",
  alternates: { canonical: "/disclaimer" },
  robots: { index: true, follow: true },
};

const rows = [
  { icon: Calculator, result: "Calculation", meaningTitle: "Based on information entered", meaning: "Your result uses the details and selections you provide, together with the 2026 calculation rules.", actionTitle: "Check your inputs", action: "Review every entry and selection to make sure it is complete and accurate." },
  { icon: MessageSquareText, result: "Tax advice", meaningTitle: "Educational information only", meaning: "The result and explanations are general and are not tailored advice for your circumstances.", actionTitle: "Consult a qualified professional", action: "Confirm filing, deduction and remittance obligations with a qualified Nigerian tax professional." },
  { icon: FileText, result: "Export", meaningTitle: "Personal calculation record", meaning: "PDF, spreadsheet and printed downloads are personal records of this calculation only.", actionTitle: "Not a return or proof of remittance", action: "An export is not a tax return, assessment, tax-clearance certificate or evidence of payment." },
  { icon: Scale, result: "Rules", meaningTitle: "Based on the 2026 ruleset", meaning: "Results reflect the legislation, guidance and assumptions used by SalarySabi for the 2026 calendar year.", actionTitle: "Review the method and date", action: "Check the methodology and verification date before relying on an estimate." },
];

export default function DisclaimerPage() {
  return (
    <PublicPageShell>
      <article className="disclaimer-ledger-page">
        <div className="disclaimer-ledger-intro">
          <header>
            <span className="eyebrow">Disclaimer</span>
            <h1>Before you use this estimate</h1>
            <h2>Your PAYE result is an estimate</h2>
            <p>SalarySabi is an independent educational tool. It is not operated, endorsed or certified by the Joint Revenue Board or a state revenue authority.</p>
          </header>
          <aside className="disclaimer-ledger-warning" aria-labelledby="disclaimer-warning-title">
            <AlertOctagon aria-hidden="true" />
            <strong id="disclaimer-warning-title">Do not use this estimate as proof that tax was filed or paid.</strong>
          </aside>
        </div>
        <section className="disclaimer-ledger" aria-labelledby="disclaimer-ledger-heading">
          <h2 className="sr-only" id="disclaimer-ledger-heading">What your estimate means and what to do</h2>
          <div className="disclaimer-ledger-head" aria-hidden="true"><span>Your result</span><span>What it means</span><span>What to do</span></div>
          {rows.map(({ icon: Icon, ...row }) => (
            <article className="disclaimer-ledger-row" key={row.result}>
              <div data-label="Your result"><Icon aria-hidden="true" /><strong>{row.result}</strong></div>
              <div data-label="What it means"><strong>{row.meaningTitle}</strong><p>{row.meaning}</p></div>
              <div data-label="What to do"><strong>{row.actionTitle}</strong><p>{row.action}</p></div>
            </article>
          ))}
        </section>
        <nav className="disclaimer-ledger-actions" aria-label="Disclaimer next steps">
          <Link className="primary-button" href="/how-paye-is-calculated">See how we calculate</Link>
          <Link href="/#calculator">Calculate again</Link>
          <Link className="disclaimer-privacy-link" href="/privacy">Privacy</Link>
        </nav>
      </article>
    </PublicPageShell>
  );
}
