import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { rulesVerifiedDate, rulesetVersion } from "@/lib/site";

export const metadata: Metadata = {
  title: "About SalarySabi | Nigerian PAYE Calculator",
  description: "Who maintains SalarySabi, how its PAYE calculator is checked, and how to report a correction.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About SalarySabi"
      title="PAYE and take-home pay should be clear."
      intro="SalarySabi helps Nigerians calculate PAYE and understand the numbers behind their take-home pay. I built and maintain it independently."
      contents={[
        { href: "#who", label: "Who we are" },
        { href: "#standards", label: "How we check tax content" },
        { href: "#contact", label: "Contact and corrections" },
      ]}
    >
      <div className="trust-page">
        <section className="trust-section trust-split" id="who">
          <div><span className="eyebrow">Who built it</span><h2>One developer. One clear need.</h2></div>
          <div>
            <p>I am Ozichi Nwosu, a Nigerian software engineer based in the United States. I moved to the US in 2015 and built SalarySabi independently after noticing that Nigerians needed a clear place to calculate PAYE and understand their take-home pay.</p>
            <p>I designed and developed the platform myself.</p>
            <div className="trust-disclosure">
              <h3>What SalarySabi is not</h3>
              <p>SalarySabi is not part of the Joint Revenue Board, Nigeria Revenue Service or any state revenue authority.</p>
              <p><strong>I am not an accountant, tax adviser or finance professional.</strong> The calculator is an educational tool built from published legislation and official guidance. Important tax decisions should be confirmed with the relevant revenue authority or a qualified Nigerian tax professional.</p>
              <p><strong>No qualified tax professional has independently reviewed or endorsed SalarySabi yet.</strong> When that changes, the reviewer, scope and date will be published here.</p>
            </div>
          </div>
        </section>

        <section className="trust-section" id="standards">
          <div className="trust-heading"><span className="eyebrow">Editorial standard</span><h2>How we check the numbers</h2><p>We do not ask you to trust a mystery formula.</p></div>
          <ol className="trust-steps">
            <li><span>01</span><div><h3>Start with primary sources</h3><p>Calculator rules are mapped to legislation and official Joint Revenue Board guidance.</p></div></li>
            <li><span>02</span><div><h3>Test the calculation</h3><p>Automated tests cover tax bands, reliefs, deductions, rounding and important boundary values.</p></div></li>
            <li><span>03</span><div><h3>Show our working</h3><p>The calculator exposes the annual calculation and each tax band instead of returning one unexplained number.</p></div></li>
            <li><span>04</span><div><h3>Be clear about the limits</h3><p>SalarySabi provides educational estimates. It does not replace an accountant, tax adviser or revenue authority.</p></div></li>
          </ol>
          <aside className="trust-status"><div><span>Current ruleset</span><strong>{rulesetVersion}</strong></div><div><span>Last verified</span><strong>{rulesVerifiedDate}</strong></div><Link href="/tax-updates">Read the tax changelog</Link></aside>
        </section>

        <section className="trust-section trust-contact" id="contact">
          <div><span className="eyebrow">Contact and corrections</span><h2>See something wrong? Tell us.</h2><p>Choose the right inbox so we can handle your message properly. Include the page, figure or behaviour you are reporting.</p></div>
          <div><p><a href="mailto:hello@salarysabi.com?subject=SalarySabi%20feedback">hello@salarysabi.com</a> for general questions</p><p><a href="mailto:tax@salarysabi.com?subject=Tax%20rule%20correction">tax@salarysabi.com</a> for tax-rule corrections</p><p><a href="mailto:security@salarysabi.com?subject=Security%20report">security@salarysabi.com</a> for security reports</p><p><a href="mailto:privacy@salarysabi.com?subject=Privacy%20request">privacy@salarysabi.com</a> for privacy requests</p><p>Do not email salary figures, payslips, passwords or other sensitive personal information.</p></div>
        </section>
      </div>
    </InfoPage>
  );
}
