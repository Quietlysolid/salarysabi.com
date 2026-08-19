import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Terms of Use | SalarySabi",
  description: "Terms governing use of SalarySabi calculators, job listings and account features.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of use"
      intro="The rules for using SalarySabi calculators, jobs, accounts and payroll tools."
      contents={[
        { href: "#using-salarysabi", label: "Using SalarySabi" },
        { href: "#estimates", label: "Estimates" },
        { href: "#jobs", label: "Job listings" },
        { href: "#payroll", label: "Payroll" },
        { href: "#accounts", label: "Accounts" },
        { href: "#changes", label: "Changes" },
        { href: "#ownership", label: "Ownership" },
        { href: "#liability", label: "Liability" },
        { href: "#law", label: "Governing law" },
        { href: "#contact", label: "Contact" },
      ]}
    >
      <section className="terms-summary" aria-labelledby="terms-summary-title">
        <h2 id="terms-summary-title">What you need to know</h2>
        <div>
          <article><strong>Calculations are estimates.</strong><span>They are not tax advice, a filing or proof of payment.</span></article>
          <article><strong>You are responsible for your information.</strong><span>Check what you enter and protect access to your account.</span></article>
          <article><strong>Check job listings before applying.</strong><span>SalarySabi reviews listings but cannot guarantee every detail.</span></article>
          <article><strong>Payroll does not move money or file taxes.</strong><span>Employers remain responsible for payments, filings and remittances.</span></article>
        </div>
      </section>
      <div className="legal-sections">
        <p className="legal-updated">Last updated: <strong>8 August 2026</strong></p>
        <section id="using-salarysabi"><h2>1. Using SalarySabi</h2><p>SalarySabi is independently owned and operated by Ozichi Nwosu from Maryland, United States. You may use SalarySabi for lawful personal and business-information purposes. Do not misuse the service, attempt unauthorised access, interfere with its operation, or submit unlawful, misleading or harmful content.</p></section>
        <section id="estimates"><h2>2. Estimates, not tax advice</h2><p>Calculator results are educational estimates based on the information you enter and the rules identified on the methodology page. They are not tax advice, an assessment, a tax return, proof of filing or proof of payment.</p><p>Check important decisions with the relevant revenue authority or a qualified Nigerian tax professional.</p></section>
        <section id="jobs"><h2>3. Job listings</h2><p>Job information may be supplied by employers, recruiters or public sources. SalarySabi reviews listings but does not guarantee that every listing is complete, current or error-free. Applying does not create an employment relationship with SalarySabi.</p></section>
        <section id="payroll"><h2>4. Payroll workspace</h2><p>The payroll workspace calculates estimates and prepares records from information supplied by the employer. SalarySabi does not move salary funds, file returns, remit PAYE or pension contributions, verify employee records, or act as an accountant or payroll agent. Employers remain responsible for reviewing calculations, protecting account access, paying employees and meeting every filing and remittance obligation.</p></section>
        <section id="accounts"><h2>5. Accounts and submitted information</h2><p>You are responsible for information submitted through your account and for protecting access to it. Our handling of personal information is described in the <Link href="/privacy">privacy notice</Link>.</p></section>
        <section id="changes"><h2>6. Availability and changes</h2><p>We may correct, improve, suspend or remove parts of the service. Tax rules and official guidance may change, so check the verification date and <Link href="/tax-updates">tax changelog</Link> before relying on an estimate.</p></section>
        <section id="ownership"><h2>7. Intellectual property</h2><p>SalarySabi&apos;s brand, interface and original content belong to SalarySabi or their respective licensors. Official legislation and public documents remain the property of their publishers.</p></section>
        <section id="liability"><h2>8. Liability</h2><p>To the extent permitted by applicable law, SalarySabi is not responsible for losses caused by incorrect inputs, unsupported circumstances, third-party content, service interruption, or decisions made from an estimate.</p></section>
        <section id="law"><h2>9. Governing law</h2><p>These terms are governed by the laws of the State of Maryland, United States, without regard to its conflict-of-law principles. Nothing in these terms removes any consumer or other legal rights that cannot be waived under the laws that apply to you.</p></section>
        <section id="contact"><h2>10. Contact</h2><p>Questions about these terms can be sent to <a href="mailto:hello@salarysabi.com?subject=Terms%20question">hello@salarysabi.com</a>. Do not include sensitive salary, payroll or identity information.</p></section>
      </div>
    </InfoPage>
  );
}
