import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Tax Calculator Disclaimer",
  description: "Important limitations and guidance for SalarySabi PAYE calculator estimates.",
  alternates: { canonical: "/disclaimer" },
  robots: { index: true, follow: true },
};

const essentials = [
  "Check your entries before relying on a result.",
  "Confirm filing and remittance obligations with a qualified professional.",
  "Downloads are personal records, not tax returns or tax-clearance certificates.",
  "Estimates use SalarySabi's 2026 calculation rules.",
];

export default function DisclaimerPage() {
  return (
    <PublicPageShell>
      <article className="disclaimer-ledger-page disclaimer-plain-page">
        <header className="disclaimer-plain-hero">
          <h1>Disclaimer</h1>
        </header>
        <section className="disclaimer-summary-grid" aria-label="What you need to know">
          {essentials.map((item) => <p key={item}>{item}</p>)}
        </section>
        <nav className="disclaimer-ledger-actions disclaimer-plain-actions" aria-label="Disclaimer next steps">
          <Link className="primary-button" href="/how-paye-is-calculated">See how we calculate</Link>
          <Link href="/#calculator">Calculate again</Link>
          <Link className="disclaimer-privacy-link" href="/privacy">Privacy</Link>
        </nav>
      </article>
    </PublicPageShell>
  );
}
