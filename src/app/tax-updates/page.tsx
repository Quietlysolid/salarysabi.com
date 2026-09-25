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
  { href: "#history", label: "Earlier updates" },
  { href: "#sources", label: "Official sources" },
];

const sources = [
  { id: "source-act", title: "Nigeria Tax Act 2025", href: taxActUrl, detail: "National Assembly text: sections 30, 56, 58, 59, 162 and 201; Fourth Schedule." },
  { id: "source-pit", title: "JRB Personal Income Tax Guidelines 2026", href: pitGuidelinesUrl, detail: "Paragraphs 8–9: deductions and rent relief. Appendix 1: personal tax bands." },
  { id: "source-transition", title: "Tax Acts transition guidance", href: taxTransitionUrl, detail: "Federal Ministry of Finance announcement, 18 June 2026. Treatment of earlier periods." },
  { id: "source-presumptive", title: "Presumptive Tax Regulations 2026", href: presumptiveTaxUrl, detail: "Regulations 1–3 and 6: scope and assessment where income cannot be reliably established." },
  { id: "source-virtual", title: "Guidelines on Taxation of Virtual Assets", href: virtualAssetsTaxUrl, detail: "NRS/JRB circular 2026/21, 31 July 2026. Outside SalarySabi’s current calculation scope." },
  { id: "source-withholding", title: "Withholding Tax Regulations 2024", href: withholdingRegulationsUrl, detail: "Payment categories, rates and conditions. The investment tool uses the rate you confirm." },
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
              <h2 id="latest-heading">Corrections to business tax and payroll</h2>
              <ul>
                <li><strong>Freelance and foreign business income:</strong> removed an employment-only exemption from business-profit estimates.</li>
                <li><strong>Planning tools:</strong> decimal amounts and rates are now preserved.</li>
                <li><strong>Payroll:</strong> mortgage and life-insurance tax reliefs are separate from money deducted from pay. Insurance relief uses eligible premiums paid in the preceding year.</li>
                <li><strong>Company tax:</strong> you can enter separate profit figures for income tax and development levy.</li>
              </ul>
              <p><strong>Used an affected tool before this update?</strong> Recalculate your estimate. Employers should review affected payroll records; saved finalised runs are not rewritten automatically.</p>
            </section>

            <div className="terms-full-text">
              <section id="rules" aria-labelledby="rules-heading">
                <h2 id="rules-heading">Rules and coverage</h2>
                <p className="terms-date">Official sources checked: <time dateTime={rulesVerifiedIso}>{rulesVerifiedDate}</time></p>
                <p>The checks below concern supported 2026 estimates. The Tax Act took effect on 1 January 2026; our September corrections are software changes, not new tax rates.</p>
                <div className="tax-rule-details">
                  <details><summary>Salary, payslip checks and payroll</summary><div>
                    <p>Annual taxable-income bands remain 0%, 15%, 18%, 21%, 23% and 25%. Rent relief remains 20% of eligible annual rent, capped at ₦500,000. The minimum-wage employment exemption is separate from the zero-rate band.</p>
                    <p>Regular monthly pay only. The personal calculator accepts pension, NHF, NHIS and rent relief; mortgage and life-insurance reliefs are available in payroll. Eligibility and supporting records still matter.</p>
                    <p>References: <a href="#source-act">Act, sections 30, 58 and 162(1)(t); Fourth Schedule</a>, and <a href="#source-pit">JRB deductions guidance</a>. <Link href="/how-paye-is-calculated">See the PAYE calculation</Link>.</p>
                  </div></details>
                  <details><summary>Freelance and foreign business income</summary><div>
                    <p>These tools use personal income-tax bands on sole-trader profit supported by records. They do not calculate presumptive tax, virtual-asset income, mixed income or foreign-tax credits.</p>
                    <p>The <a href="#source-presumptive">2026 presumptive regulations</a> and <a href="#source-virtual">July virtual-asset guidance</a> cover different circumstances. An amount in foreign currency alone does not establish its tax treatment.</p>
                  </div></details>
                  <details><summary>Company income tax and development levy</summary><div>
                    <p>The linked Act uses 30% of total profits for company income tax and 4% of assessable profits for development levy, with small-company relief. Its size limits are ₦100 million turnover and ₦250 million total fixed assets.</p>
                    <p>The simple estimate uses the same profit proxy for both taxes. Enter figures from your tax computation to use distinct bases. The planner does not determine incentives, losses, special-sector taxes or minimum effective tax.</p>
                    <p>References: <a href="#source-act">Act, sections 27, 56, 59 and 201</a>. For accounting periods ending before 1 January 2026, use the <a href="#source-transition">transition guidance</a> rather than this estimate.</p>
                  </div></details>
                  <details><summary>Investment withholding</summary><div>
                    <p>This tool multiplies a payment by the rate you confirm. It does not choose the rate, apply treaty relief or calculate tax on investment gains or virtual assets.</p>
                    <p>Check the <a href="#source-withholding">withholding regulations</a> and any applicable exemption with your revenue authority.</p>
                  </div></details>
                </div>
                <p className="tax-updates-limits"><Link href="/calculation-notes">All calculation assumptions and limits</Link></p>
              </section>

              <section id="history" aria-labelledby="history-heading">
                <h2 id="history-heading">Earlier updates</h2>
                <div className="tax-rule-details tax-update-history">
                  <details><summary><time dateTime="2026-07-29">29 July 2026</time><span>Earlier PAYE source check</span></summary><div><p>The earlier update recorded a check against JRB guidance. The September corrections and source check above supersede that entry; it was not an independent professional review.</p></div></details>
                  <details><summary><time dateTime="2026-04-07">7 April 2026</time><span>JRB announced its PIT guidelines</span></summary><div><p>The announcement introduced the official guidance used alongside the Act. The linked PDF is dated 24 February 2026. These are publication dates, separate from the Act’s commencement.</p></div></details>
                </div>
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
