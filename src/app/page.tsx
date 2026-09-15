import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";
import { PayeGuideCalculator } from "@/components/paye-guide-calculator";
import { formatNaira, salaryExamples } from "@/lib/offer";
import { siteUrl, taxReviewStatus } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nigeria Take-Home Pay Calculator 2026 | SalarySabi",
  description: "See what your Nigerian salary becomes after PAYE and pension. Calculate your 2026 take-home pay, check a payslip or understand a job offer. No signup.",
  alternates: { canonical: "/" },
};

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SalarySabi Nigeria Take-Home Pay Calculator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: siteUrl,
    offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" },
    description: "Estimate Nigerian take-home pay after PAYE and pension, check your payslip and understand a job offer.",
  };

  return <PublicPageShell className="decision-page">
    <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} type="application/ld+json" />
    <header className="take-home-hero">
      <span className="eyebrow">Know what your salary really pays</span>
      <h1>Nigeria Take-Home<br />Pay Calculator</h1>
      <p className="take-home-lead">See what your salary actually becomes after PAYE.</p>
      <p>Enter your monthly salary and see your estimated 2026 take-home pay, PAYE and pension deductions.</p>
      <Link className="decision-primary" href="#calculator">Calculate my take-home pay <span aria-hidden="true">→</span></Link>
      <p className="take-home-trust">No signup · Your salary stays on your device · Nigeria’s 2026 tax rules<br /><Link href="/calculation-notes" title={taxReviewStatus}>PAYE methodology independently reviewed</Link></p>
      <Link className="take-home-payslip" href="/payslip-checker">Got a payslip? Check if your PAYE looks right →</Link>
    </header>
    <div id="calculator" className="take-home-calculator"><PayeGuideCalculator embedded /></div>
    <section className="decision-next" aria-labelledby="decision-next-title">
      <header><span className="eyebrow">Your next salary decision</span><h2 id="decision-next-title">Make the numbers work for you.</h2></header>
      <div><Link href="/payslip-checker"><span>01</span><h3>Check my payslip</h3><p>Compare your PAYE with an estimate and get questions to ask payroll.</p><strong>Check my payslip →</strong></Link><Link href="/offer-checker"><span>02</span><h3>Check a job offer</h3><p>Factor in rent and deductions. Find the salary you need for your target take-home.</p><strong>Check my offer →</strong></Link></div>
    </section>
    <section className="decision-examples" aria-labelledby="salary-examples-title"><h2 id="salary-examples-title">What does your salary pay after tax?</h2><p>Start with a common monthly salary, then adjust the pension assumptions.</p><div>{salaryExamples.map(amount => <Link key={amount} href={`/salary-after-tax/${amount}`}>{formatNaira(amount)} after tax →</Link>)}</div></section>
  </PublicPageShell>;
}
