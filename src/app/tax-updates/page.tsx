import type { Metadata } from "next";
import Link from "next/link";
import { InfoFooter } from "@/components/info-page";
import { GatewayHeader } from "@/components/split-gateway-home";
import {
  pitGuidelinesUrl, presumptiveTaxUrl, rulesetVersion, rulesVerifiedDate,
  rulesVerifiedIso, taxActUrl, taxTransitionUrl,
  virtualAssetsTaxUrl, withholdingRegulationsUrl,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Tax Calculation Updates | SalarySabi",
  description: "Changes to SalarySabi's calculations, supported scenarios and official Nigerian tax sources checked on 24 September 2026.",
  alternates: { canonical: "/tax-updates" },
};

const contents = [
  { href: "#latest-update", label: "Latest update" },
  { href: "#rules", label: "Rules and coverage" },
  { href: "#sources", label: "Official sources" },
];

const sources = [
  { id: "source-act", title: "Nigeria Tax Act 2025", href: taxActUrl, detail: "Sections 27, 30, 56, 58, 59, 162 and 201; Fourth Schedule." },
  { id: "source-pit", title: "JRB Personal Income Tax Guidelines 2026", href: pitGuidelinesUrl, detail: "Deductions and bands: paragraphs 8–9; Appendix 1. Dated 24 February 2026; announced 7 April." },
  { id: "source-transition", title: "Tax Acts transition guidance", href: taxTransitionUrl, detail: "Finance Ministry announcement on earlier tax periods, 18 June 2026." },
  { id: "source-presumptive", title: "Presumptive Tax Regulations 2026", href: presumptiveTaxUrl, detail: "Scope and assessment: regulations 1–3 and 6." },
  { id: "source-virtual", title: "Guidelines on Taxation of Virtual Assets", href: virtualAssetsTaxUrl, detail: "NRS/JRB circular 2026/21, 31 July 2026." },
  { id: "source-withholding", title: "Withholding Tax Regulations 2024", href: withholdingRegulationsUrl, detail: "Payment categories, rates and conditions." },
];

function SectionLinks() {
  return <nav aria-label="Tax update sections">{contents.map(item => <a href={item.href} key={item.href}>{item.label}</a>)}</nav>;
}

export default function TaxUpdatesPage() {
  return (
    <div className="split-gateway-shell terms-page-shell tax-updates-document-shell">
      <GatewayHeader />
      <main id="main-content" tabIndex={-1}>
        <div className="terms-document tax-updates-document">
          <header className="terms-heading">
            <h1>Tax calculation updates</h1>
          </header>
          <aside className="terms-sidebar"><strong>On this page</strong><SectionLinks /></aside>
          <details className="terms-mobile-contents"><summary>On this page</summary><SectionLinks /></details>
          <article className="terms-body" aria-label="Tax calculation updates">
            <section id="latest-update" className="tax-update-latest" aria-labelledby="latest-heading">
              <p className="tax-update-meta"><time dateTime="2026-09-24">24 September 2026</time><span>Calculation version {rulesetVersion}</span></p>
              <h2 id="latest-heading">What changed</h2>
              <ul>
                <li><strong>Freelance and foreign business income:</strong> business-income estimates no longer apply the minimum-wage exemption for employees.</li>
                <li><strong>Planning tools:</strong> fixed how decimal amounts and rates are read.</li>
                <li><strong>Payroll:</strong> mortgage and life-insurance tax reliefs are separate from money deducted from pay. Insurance relief uses eligible premiums paid in the preceding year.</li>
                <li><strong>Company tax:</strong> you can enter separate profit figures for income tax and development levy.</li>
              </ul>
              <p><strong>Used an affected tool before this update?</strong> Recalculate your estimate. Employers should review affected payroll records. Previously finalised payroll records remain unchanged.</p>
            </section>

            <div className="terms-full-text">
              <section id="rules" aria-labelledby="rules-heading">
                <h2 id="rules-heading">Rules and coverage</h2>
                <p className="terms-date">Official sources checked: <time dateTime={rulesVerifiedIso}>{rulesVerifiedDate}</time></p>
                <p>These tools use 2026 tax rules. The September update corrected our calculations; it did not change the tax rates.</p>
                <div className="tax-rule-details">
                  <details><summary>Salary, payslip checks and payroll</summary><div>
                    <p>Annual taxable-income bands remain 0%, 15%, 18%, 21%, 23% and 25%. Rent relief remains 20% of eligible annual rent, capped at ₦500,000. The minimum-wage employment exemption is separate from the zero-rate band.</p>
                    <p>Regular monthly pay only. The personal calculator accepts pension, NHF, NHIS and rent relief; mortgage and life-insurance reliefs are available in payroll. Eligibility and supporting records still matter.</p>
                    <p>References: <a href="#source-act">Act, sections 30, 58 and 162(1)(t); Fourth Schedule</a>, and <a href="#source-pit">JRB deductions guidance</a>. <Link href="/how-paye-is-calculated">See the PAYE calculation</Link>.</p>
                  </div></details>
                  <details><summary>Freelance and foreign business income</summary><div>
                    <p>These tools use personal income-tax bands on sole-trader profit supported by records. They do not calculate <a href="#source-presumptive">presumptive tax</a>, <a href="#source-virtual">virtual-asset income</a>, mixed income or foreign-tax credits.</p>
                    <p>Receiving payment in foreign currency does not, by itself, determine the tax you owe.</p>
                  </div></details>
                  <details><summary>Company income tax and development levy</summary><div>
                    <p>The linked Act uses 30% of total profits for company income tax and 4% of assessable profits for development levy, with small-company relief. Its size limits are ₦100 million turnover and ₦250 million total fixed assets.</p>
                    <p>The simple estimate uses revenue minus expenses for both taxes. Enter figures from your tax computation to use distinct bases. The planner does not determine incentives, losses, special-sector taxes or minimum effective tax.</p>
                    <p>References: <a href="#source-act">Act, sections 27, 56, 59 and 201</a>. For accounting periods ending before 1 January 2026, use the <a href="#source-transition">transition guidance</a> rather than this estimate.</p>
                  </div></details>
                  <details><summary>Investment withholding</summary><div>
                    <p>This tool multiplies a payment by the rate you confirm. It does not choose the rate, apply treaty relief or calculate tax on investment gains or virtual assets.</p>
                    <p>Check the <a href="#source-withholding">withholding regulations</a> and any applicable exemption with your revenue authority.</p>
                  </div></details>
                </div>
                <p className="tax-updates-limits"><Link href="/calculation-notes">All calculation assumptions and limits</Link></p>
              </section>

              <section id="sources" aria-labelledby="sources-heading">
                <h2 id="sources-heading">Official sources</h2>
                <ul className="tax-source-list">{sources.map(source => <li id={source.id} key={source.id}><a href={source.href}>{source.title}</a><span>{source.detail}</span></li>)}</ul>
                <p className="tax-updates-contact">Spotted a change? <a href="mailto:tax@salarysabi.com?subject=Tax%20rule%20correction">Email us the official source</a>.</p>
              </section>
            </div>
          </article>
        </div>
      </main>
      <InfoFooter />
    </div>
  );
}
