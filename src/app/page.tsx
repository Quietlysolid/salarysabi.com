import Link from "next/link";
import { Calculator } from "@/components/calculator";
import { InfoFooter, InfoHeader } from "@/components/info-page";
import { siteUrl } from "@/lib/site";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SalarySabi Nigeria PAYE Calculator 2026",
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
      <InfoHeader />

      <section className="hero">
        <div className="hero-copy">
          <h1>
            Salary and job help for Nigerians.
          </h1>
          <p>
            Calculate your PAYE, check your payslip, understand deductions and
            find jobs that show the salary.
          </p>
          <div className="trust-row">
            <span>No signup</span>
            <span>Free</span>
            <span>Built around official guidance</span>
          </div>
        </div>
      </section>

      <section className="home-tools" aria-labelledby="home-tools-title">
        <div>
          <span className="eyebrow">Choose a tool</span>
          <h2 id="home-tools-title">What do you need help with?</h2>
        </div>
        <div className="home-tool-grid">
          <a href="#calculator"><span>01</span><strong>Calculate PAYE</strong><small>Estimate the tax on your salary</small></a>
          <Link href="/payslip-checker"><span>02</span><strong>Check my payslip</strong><small>Compare your PAYE and deductions</small></Link>
          <Link href="/jobs"><span>03</span><strong>Find jobs with salaries</strong><small>See the pay before you apply</small></Link>
          <Link href="/eligible-deductions"><span>04</span><strong>Understand deductions</strong><small>Pension, NHF, rent relief and more</small></Link>
        </div>
      </section>

      <div id="calculator">
        <Calculator />
      </div>

      <section className="home-more-help">
        <div>
          <span className="eyebrow">Understand your pay</span>
          <h2>Clear answers when you need more detail.</h2>
          <p>Read a short explanation instead of searching through tax documents.</p>
        </div>
        <nav aria-label="Salary guides">
          <Link href="/how-paye-is-calculated">How PAYE is calculated</Link>
          <Link href="/tax-bands">Nigeria’s 2026 tax bands</Link>
          <Link href="/eligible-deductions">Deductions that can reduce PAYE</Link>
        </nav>
      </section>

      <section className="home-jobs-link">
        <div><span className="eyebrow light">Looking for work?</span><h2>Find jobs that show what they pay.</h2></div>
        <Link href="/jobs">Find jobs</Link>
      </section>

      <InfoFooter />
    </main>
  );
}
