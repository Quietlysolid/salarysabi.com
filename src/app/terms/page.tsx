import type { Metadata } from "next";
import Link from "next/link";
import { InfoFooter } from "@/components/info-page";
import { GatewayHeader } from "@/components/split-gateway-home";

export const metadata: Metadata = {
  title: "Terms of Use | SalarySabi",
  description: "Terms governing SalarySabi pay tools, salary community, job listings, payroll and accounts.",
  alternates: { canonical: "/terms" },
};

const contents = [
  { href: "#using-salarysabi", label: "Using SalarySabi" },
  { href: "#estimates", label: "Estimates" },
  { href: "#jobs", label: "Job listings" },
  { href: "#community", label: "Salary community" },
  { href: "#payroll", label: "Payroll" },
  { href: "#accounts", label: "Accounts" },
  { href: "#changes", label: "Changes" },
  { href: "#ownership", label: "Ownership" },
  { href: "#liability", label: "Liability" },
  { href: "#law", label: "Governing law" },
  { href: "#contact", label: "Contact" },
];

function TermsLinks() {
  return <nav aria-label="Terms sections">{contents.map(({ href, label }) => <a key={href} href={href}>{label}</a>)}</nav>;
}

export default function TermsPage() {
  return <div className="split-gateway-shell terms-page-shell">
    <GatewayHeader />
    <main id="main-content" tabIndex={-1}>
      <div className="terms-document">
        <header className="terms-heading">
          <h1>Terms of use</h1>
          <p className="terms-date">Last updated: <strong>24 September 2026</strong></p>
          <p className="terms-date">Effective 24 September 2026: updated account, employer and salary-community terms.</p>
        </header>
        <aside className="terms-sidebar"><strong>On this page</strong><TermsLinks /></aside>
        <details className="terms-mobile-contents"><summary>On this page</summary><TermsLinks /></details>
        <article className="terms-body" aria-label="Terms of use">
          <section className="terms-at-a-glance" aria-labelledby="terms-summary-title">
            <h2 id="terms-summary-title">At a glance</h2>
            <p>Summary only; the full terms follow.</p>
            <ul>
              <li><strong>Calculations are estimates.</strong> They are not tax advice, a filing or proof of payment.</li>
              <li><strong>Community salaries are self-reported.</strong> They may not represent the wider market.</li>
              <li><strong>You are responsible for your information.</strong> Check what you enter and protect access to your account.</li>
              <li><strong>Check job listings before applying.</strong> Approval does not verify every detail.</li>
              <li><strong>Payroll does not move money or file taxes.</strong> Employers remain responsible for payments, filings and remittances.</li>
            </ul>
          </section>
          <div className="terms-full-text">
        <section id="using-salarysabi"><h2>1. Using SalarySabi</h2>
<p>SalarySabi is operated by Ozichi Nwosu in Maryland, United States. Use it for lawful personal or business purposes. You must have legal capacity to create an account and authority to act for any organisation you represent.</p>
<p>Do not misuse the service, attempt unauthorised access, interfere with its operation, or submit unlawful, misleading or harmful content.</p></section>
        <section id="estimates"><h2>2. Estimates, not tax advice</h2>
<p>Pay, payslip, company-tax and payroll results use your inputs and the tool&apos;s <Link href="/calculation-notes">calculation rules</Link>. Results and downloads are estimates or records, not tax advice, official assessments, tax returns, tax-clearance certificates or proof of filing or payment.</p>
<p>Check your inputs, pay period and deductions before relying on a result. A difference from our estimate does not establish a payslip error. Confirm tax decisions with the relevant revenue authority or a qualified Nigerian tax professional.</p></section>
        <section id="jobs"><h2>3. Job listings</h2>
<p>Listings come from employers, recruiters and public sources. Employer submissions require administrator approval before publication; approval does not guarantee accuracy or that a vacancy remains open. Check the source and application destination. SalarySabi is not the employer and does not guarantee an offer.</p>
<p>Advertise only roles you are authorised to post, with accurate job, pay and application details. Request updates or removal when a role changes or closes. Fabricated roles, misleading pay ranges and fees to apply are prohibited.</p>
<p>We may reject or remove misleading, unsafe or unlawful listings. Track submissions linked to your account in the <Link href="/hiring">hiring workspace</Link>.</p></section>
        <section id="community"><h2>4. Salary community</h2>
<p>Community figures come from user reports, not a representative market survey or a promise of what an employer will pay.</p>
<p>Submit information you reasonably believe is accurate and are entitled to share. Do not include another person&apos;s personal information or identifying details in a salary report. We may review, exclude or remove submissions that breach these terms.</p>
<p>Public comparisons require approved reports and a minimum group size. Individual reports are not published. Our <Link href="/privacy#information">privacy notice</Link> explains eligibility and how reports are counted.</p></section>
        <section id="payroll"><h2>5. Payroll workspace</h2>
<p>The payroll workspace calculates monthly pay estimates and prepares payslips and records from employer inputs. It does not transfer money, file returns, remit PAYE or pensions, verify employee records, or act as an accountant or payroll agent.</p>
<p>Employers must review payroll, pay employees and meet filing and remittance obligations. Provide only necessary employee information, establish a lawful basis for sharing it and give employees any required privacy information.</p>
<p>SalarySabi retains its own data-protection responsibilities. See our <Link href="/privacy">privacy notice</Link>.</p></section>
        <section id="accounts"><h2>6. Accounts and submitted information</h2>
<p>Keep account information accurate and sign-in credentials secure. Do not share access with unauthorised people.</p>
<p>Report suspected account misuse to <a href="mailto:security@salarysabi.com">security@salarysabi.com</a>. Never send passwords or sign-in codes. Request account closure or data deletion at <a href="mailto:privacy@salarysabi.com">privacy@salarysabi.com</a>; see <Link href="/privacy#retention">retention details</Link>.</p>
<p>We may restrict access to address misuse, security risks or legal requirements. You can ask for a reason and review. We may withhold details to protect security, another person&apos;s privacy or a legal obligation.</p></section>
        <section id="changes"><h2>7. Availability and changes</h2>
<p>We may correct, improve, suspend or remove parts of the service. Availability may be affected by maintenance, technical failures or security incidents. Retain copies of records you need independently of the service.</p>
<p>Tax rules and official guidance may change. Check the verification date and <Link href="/tax-updates">tax changelog</Link> before relying on an estimate.</p>
<p>For material changes to these terms, we will explain what changed and when it takes effect on this page, with advance notice where practicable. Changes will not remove rights you already have. We will seek separate agreement where the law requires it.</p></section>
        <section id="ownership"><h2>8. Intellectual property and your submissions</h2>
<p>SalarySabi&apos;s brand, interface and original content belong to SalarySabi or their respective licensors. Rights in third-party legislation and public documents are unaffected by these terms.</p>
<p>You retain your rights in submitted content. You permit us to store, process and review it to provide the relevant feature, including publishing approved job details and grouped salary statistics. This permission does not allow publication of private payroll records or individual salary reports.</p>
<p>Personal information remains subject to the <Link href="/privacy">privacy notice</Link> and applicable law.</p></section>
        <section id="liability"><h2>9. Responsibility and liability</h2>
<p>Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited, or removes rights and remedies available under applicable consumer or data-protection law. Describing a result as an estimate does not, by itself, remove SalarySabi&apos;s legal responsibilities.</p></section>
        <section id="law"><h2>10. Governing law</h2><p>These terms are governed by the laws of the State of Maryland, United States, without regard to its conflict-of-law principles. Nothing in these terms removes any consumer or other legal rights that cannot be waived under the laws that apply to you.</p></section>
        <section id="contact"><h2>11. Contact</h2><p>Questions about these terms can be sent to <a href="mailto:hello@salarysabi.com?subject=Terms%20question">hello@salarysabi.com</a>. Do not include sensitive salary, payroll or identity information.</p></section>
          </div>
        </article>
      </div>
    </main>
    <InfoFooter />
  </div>;
}
