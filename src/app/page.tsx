import Link from "next/link";
import { BriefcaseBusiness, ChartNoAxesColumnIncreasing, FileCheck2 } from "lucide-react";
import { Calculator } from "@/components/calculator";
import { PublicPageShell } from "@/components/info-page";
import { siteUrl } from "@/lib/site";

export const metadata = { alternates: { canonical: "/" } };

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SalarySabi Nigerian Work and Pay Platform",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: siteUrl,
    offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" },
    description: "Calculate Nigerian PAYE and take-home pay, check a payslip, compare salaries and find jobs that publish pay.",
  };

  return <PublicPageShell>
    <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} type="application/ld+json" />
    <main className="simple-home">
      <header className="simple-home-intro">
        <p className="simple-home-slogan">Know what you earn, what you owe and what you keep.</p>
        <h1>Check your take-home pay</h1>
      </header>

      <section className="simple-home-calculator" id="calculator" aria-label="Take-home pay calculator">
        <Calculator />
      </section>

      <nav className="simple-home-next" aria-label="More SalarySabi tools">
        <Link href="/payslip-checker"><FileCheck2 aria-hidden="true" /><strong>Check payslip PAYE</strong></Link>
        <Link href="/salaries"><ChartNoAxesColumnIncreasing aria-hidden="true" /><strong>Compare salaries</strong></Link>
        <Link href="/jobs"><BriefcaseBusiness aria-hidden="true" /><strong>Find jobs</strong></Link>
      </nav>

      <aside className="salary-reward-strip">
        <div><strong>Share your salary · Earn ₦1,000</strong></div>
        <Link href="/salaries?campaign=salary-pilot-2026#salary-report">Share my salary</Link>
      </aside>
    </main>
  </PublicPageShell>;
}
