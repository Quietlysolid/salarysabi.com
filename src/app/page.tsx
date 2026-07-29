import { Calculator } from "@/components/calculator";
import { EarlyAccessForm } from "@/components/early-access-form";
import Link from "next/link";
import { lastVerified, siteUrl } from "@/lib/site";

const bands = [
  ["First ₦800,000", "0%"],
  ["Next ₦2.2m", "15%"],
  ["Next ₦9m", "18%"],
  ["Next ₦13m", "21%"],
  ["Next ₦25m", "23%"],
  ["Above ₦50m", "25%"],
];

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Nigeria PAYE Calculator 2026",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: siteUrl,
    offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" },
    description:
      "A free Nigerian PAYE calculator using the Nigeria Tax Act 2025 and JRB Personal Income Tax Guidelines 2026.",
  };

  return (
    <main>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />
      <header className="site-header">
        <a className="brand" href="#">
          <span className="brand-mark">₦</span>
          <span>Nigeria <span className="brand-accent">PAYE</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#tax-bands">2026 tax bands</a>
          <a className="nav-cta" href="#early-access">Payroll for teams</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="announcement">
            <span>New</span>
            Updated for the Nigeria Tax Act 2025
          </div>
          <h1>
            Know your PAYE.
            <br />
            <em>Keep more clarity.</em>
          </h1>
          <p>
            A clear, free Nigerian PAYE calculator for 2026. Understand
            your monthly tax, eligible deductions and exactly how every
            tax band applies.
          </p>
          <div className="trust-row">
            <span>✓ No signup</span>
            <span>✓ Free to use</span>
            <span>✓ Based on JRB guidance</span>
          </div>
        </div>
        <div className="hero-stamp" aria-hidden="true">
          <span>Built for</span>
          <strong>Nigeria</strong>
          <small>2026</small>
        </div>
      </section>

      <div id="calculator">
        <Calculator />
      </div>

      <section className="explanation" id="how-it-works">
        <div>
          <span className="eyebrow">Clear by design</span>
          <h2>No tax jargon. No mystery number.</h2>
        </div>
        <p>
          We annualise your income, subtract only the eligible deductions
          you provide, then apply each statutory band in order. The result is
          an estimate you can inspect—not a number from a black box.
        </p>
      </section>

      <section className="tax-band-section" id="tax-bands">
        <div className="section-intro">
          <span className="eyebrow">Nigeria’s 2026 bands</span>
          <h2>The first ₦800,000 of chargeable income is tax-free.</h2>
          <p>
            Higher rates apply only to the portion of income inside each
            band, not to your entire salary.
          </p>
        </div>
        <div className="band-table">
          {bands.map(([income, rate], index) => (
            <div key={income}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{income}</strong>
              <em>{rate}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="payroll-banner" id="early-access">
        <div>
          <span className="eyebrow light">For small teams</span>
          <h2>Payroll should be this clear too.</h2>
          <p>
            We’re turning this calculator into simple Nigerian payroll:
            saved employees, branded payslips and monthly payroll registers.
          </p>
        </div>
        <EarlyAccessForm />
      </section>

      <section className="source-note">
        <div className="source-icon">§</div>
        <div>
          <h2>Built from the official guidance</h2>
          <p>
            Calculation logic follows the Joint Revenue Board’s Personal
            Income Tax Guidelines 2026 and the Nigeria Tax Act 2025.
            This calculator provides an estimate and is not tax advice.
          </p>
        </div>
        <a
          href="https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Read JRB guidelines ↗
        </a>
      </section>

      <footer>
        <a className="brand footer-brand" href="#">
          <span className="brand-mark">₦</span>
          <span>Nigeria <span className="brand-accent">PAYE</span></span>
        </a>
        <div className="home-footer-links">
          <Link href="/how-paye-is-calculated">Methodology</Link>
          <Link href="/eligible-deductions">Deductions</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/disclaimer">Disclaimer</Link>
        </div>
        <span>Rules verified {lastVerified} · Independent calculator</span>
      </footer>
    </main>
  );
}
