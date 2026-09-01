import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";
import { PayeGuideCalculator } from "@/components/paye-guide-calculator";
import { pitGuidelinesUrl, taxActUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nigeria PAYE Guide 2026 | SalarySabi",
  description: "Understand how Nigerian PAYE is calculated, which deductions you can enter and how the 2026 tax bands apply.",
  alternates: { canonical: "/paye-guide" },
};

const questions = [
  { title: "How is PAYE calculated?", href: "/how-paye-is-calculated", label: "How PAYE is calculated" },
  { title: "What deductions can I enter?", href: "/eligible-deductions" },
  { title: "Which tax rate applies to me?", href: "/tax-bands" },
  { title: "What is gross pay vs take-home pay?", href: "/net-salary-vs-gross-salary-nigeria" },
] as const;

export default function PayeGuidePage() {
  return (
    <PublicPageShell>
      <article className="paye-guide-page paye-guide-simple">
        <header className="paye-guide-simple-hero">
          <span className="eyebrow">Pay &amp; tax guide</span>
          <h1>Understand your PAYE</h1>
          <p>Start with the question you need answered, then return to your calculation with clearer information.</p>
        </header>

        <PayeGuideCalculator />

        <nav className="paye-guide-question-list" aria-label="PAYE guide topics">
          {questions.map((question) => (
            <Link aria-label={"label" in question ? question.label : undefined} href={question.href} key={question.href}>
              <span>{question.title}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>

        <Link className="primary-button paye-guide-simple-action" href="/payslip-checker">Check my payslip</Link>

        <details className="paye-guide-simple-sources">
          <summary><span>Sources and updates</span><span aria-hidden="true">+</span></summary>
          <div>
            <ul>
              <li><a href={taxActUrl} rel="noreferrer" target="_blank">Nigeria Tax Act 2025 ↗</a></li>
              <li><a href={pitGuidelinesUrl} rel="noreferrer" target="_blank">JRB Personal Income Tax Guidelines 2026 ↗</a></li>
              <li><Link href="/tax-updates">See update history</Link></li>
            </ul>
          </div>
        </details>
      </article>
    </PublicPageShell>
  );
}
