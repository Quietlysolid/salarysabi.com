import Link from "next/link";
import { Calculator } from "@/components/calculator";
import { HomepageContributions } from "@/components/homepage-contributions";
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
    <div className="simple-home">
      <section className="simple-home-calculator" id="calculator" aria-label="Take-home pay calculator">
        <Calculator />
      </section>

      <section className="home-platform-paths" aria-labelledby="home-platform-title">
        <header>
          <span className="eyebrow">One connected pay journey</span>
          <h2 id="home-platform-title">Everything around pay, in one place.</h2>
        </header>
        <div>
          <article>
            <span>01</span>
            <h3>Calculate &amp; verify pay</h3>
            <p>See your take-home pay, understand PAYE and check the tax on your payslip.</p>
            <nav aria-label="Calculate and verify pay">
              <Link href="#calculator">Take-home pay</Link>
              <Link href="/payslip-checker">Check payslip PAYE</Link>
              <Link href="/paye-guide">Understand PAYE</Link>
            </nav>
          </article>
          <article>
            <span>02</span>
            <h3>Compare &amp; improve pay</h3>
            <p>Compare reviewed salary ranges and find current jobs that publish what they pay.</p>
            <nav aria-label="Compare and improve pay">
              <Link href="/salaries">Compare salaries</Link>
              <Link href="/jobs">Jobs with published pay</Link>
            </nav>
          </article>
          <article>
            <span>03</span>
            <h3>Hire &amp; pay people</h3>
            <p>Publish transparent roles, calculate payroll and understand company tax.</p>
            <nav aria-label="Hire and pay people">
              <Link href="/post-a-job">Post a job</Link>
              <Link href="/payroll">Run payroll</Link>
              <Link href="/company-tax">Company tax</Link>
            </nav>
          </article>
        </div>
      </section>

      <HomepageContributions />

      <section className="home-trust" aria-labelledby="home-trust-title">
        <header>
          <span className="eyebrow">Evidence before claims</span>
          <h2 id="home-trust-title">Numbers you can inspect.</h2>
        </header>
        <div>
          <article><strong>Official calculation rules</strong><p>PAYE estimates show the active ruleset, review date and source history.</p><Link href="/tax-updates">Inspect the rules</Link></article>
          <article><strong>Private salary groups</strong><p>Individual reports stay private. Public ranges need at least five similar approved reports.</p><Link href="/salaries">See how comparisons work</Link></article>
          <article><strong>Original job evidence</strong><p>Salary and application links are checked against a named source and stale listings are removed.</p><Link href="/about#checks">See how information is checked</Link></article>
        </div>
      </section>
    </div>
  </PublicPageShell>;
}
