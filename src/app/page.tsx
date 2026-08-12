import Link from "next/link";
import { BriefcaseBusiness, CalculatorIcon, ChartNoAxesColumnIncreasing, Users } from "lucide-react";
import { Calculator } from "@/components/calculator";
import { PublicPageShell } from "@/components/info-page";
import { rulesVerifiedDate, siteUrl } from "@/lib/site";

export const metadata = { alternates: { canonical: "/" } };

const platformOutcomes = [
  [CalculatorIcon, "Understand your pay", "Calculate PAYE, check your payslip and know what to take home."],
  [ChartNoAxesColumnIncreasing, "Compare salaries", "See anonymous benchmarks across roles, industries and locations."],
  [BriefcaseBusiness, "Find transparent jobs", "Discover opportunities that publish salary before you apply."],
  [Users, "Manage payroll", "Prepare payroll, PAYE records and payslips for a small team."],
] as const;

const paths = [
  {
    number: "01", title: "Understand my pay", description: "Calculate PAYE, check your payslip and know what to take home.",
    links: [["Calculate my PAYE", "#calculator"], ["Check my payslip", "/payslip-checker"], ["Understand my result", "/how-paye-is-calculated"]],
  },
  {
    number: "02", title: "Know my market value", description: "Compare salaries and discover jobs from companies that publish pay.",
    links: [["Compare salaries", "/salaries"], ["Find salary-transparent jobs", "/jobs"], ["Open my job workspace", "/account"]],
  },
  {
    number: "03", title: "Manage a small team", description: "Run payroll, plan company tax and find talent with confidence.",
    links: [["Run payroll", "/payroll"], ["Plan company tax", "/company-tax"], ["Post a transparent job", "/post-a-job"]],
  },
] as const;

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org", "@type": "WebApplication", name: "SalarySabi Nigerian Work and Pay Platform",
    applicationCategory: "FinanceApplication", operatingSystem: "Web", url: siteUrl,
    offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" },
    description: "Understand Nigerian PAYE and payslips, compare salaries, find salary-transparent jobs and run small-team payroll.",
  };

  return <PublicPageShell>
    <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} type="application/ld+json" />
    <article className="platform-home">
      <section className="platform-hero">
        <div className="platform-hero-copy">
          <span className="eyebrow">Nigeria&apos;s work &amp; pay platform</span>
          <h1>Understand your pay.<br />Know your worth.<br />Make better work decisions.</h1>
          <p>Get clarity on Nigerian PAYE, compare anonymous salaries, discover jobs that publish pay and run payroll for your team.</p>
          <div className="platform-hero-actions">
            <a className="primary-button" href="#calculator">Calculate my PAYE</a>
            <Link href="/salaries">Compare salaries</Link>
            <Link href="/jobs">Find jobs with salaries</Link>
          </div>
          <small>Tax rules checked {rulesVerifiedDate}. Your calculator figures stay in this browser.</small>
        </div>
        <aside className="platform-outcomes" aria-label="What SalarySabi helps you do">
          <strong>Everything you need to understand work and pay</strong>
          {platformOutcomes.map(([Icon, title, description]) => <div key={title}>
            <span aria-hidden="true"><Icon /></span><p><b>{title}</b><small>{description}</small></p>
          </div>)}
        </aside>
      </section>

      <section className="platform-paths" aria-labelledby="choose-path-title">
        <h2 className="sr-only" id="choose-path-title">Choose what you need</h2>
        {paths.map((path) => <article key={path.number}>
          <span>{path.number}</span><h2>{path.title}</h2><p>{path.description}</p>
          <nav aria-label={path.title}>{path.links.map(([label, href], index) => href.startsWith("#")
            ? <a className={index === 0 ? "featured" : ""} href={href} key={href}><b>{label}</b><span aria-hidden="true">→</span></a>
            : <Link className={index === 0 && path.number === "01" ? "featured" : ""} href={href} key={href}><b>{label}</b><span aria-hidden="true">→</span></Link>)}</nav>
        </article>)}
      </section>

      <section className="platform-calculator" id="calculator" aria-label="PAYE calculator">
        <header><span className="eyebrow">Calculate your pay</span><h2>See your 2026 PAYE and take-home pay.</h2><p>Enter your salary to estimate your tax, deductions and monthly take-home pay.</p></header>
        <div className="guided-workspace"><div className="guided-calculator"><Calculator guided /></div><aside className="guided-explainer"><span className="eyebrow">You will see</span><h2>More than one tax number.</h2><p>Understand your estimated net pay, PAYE breakdown, deductions and the rules behind the result.</p><nav aria-label="Calculation guides"><Link href="/how-paye-is-calculated"><span>01</span><div><strong>Full calculation</strong><small>Follow every step through to monthly PAYE.</small></div><b>View</b></Link><Link href="/eligible-deductions"><span>02</span><div><strong>Eligible deductions</strong><small>Know what belongs in the calculator.</small></div><b>View</b></Link><Link href="/tax-bands"><span>03</span><div><strong>Current tax bands</strong><small>See the rates and thresholds used.</small></div><b>View</b></Link></nav></aside></div>
      </section>

      <aside className="platform-trust" aria-label="Why you can trust SalarySabi"><div><strong>Your privacy matters</strong><span>Calculator figures stay on your device.</span></div><div><strong>Current 2026 rules</strong><span>Rules checked {rulesVerifiedDate}.</span></div><div><strong>Built by a Nigerian, for Nigerians</strong><span>Independent tools for how Nigerians work and earn.</span></div></aside>
    </article>
  </PublicPageShell>;
}
