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
    <InfoPage eyebrow="Terms of use" title="Terms for using SalarySabi." intro="These terms cover the calculator, payroll workspace, job listings, accounts and your responsibilities when using the service.">
      <div className="legal-sections">
        <p className="legal-updated">Last updated: <strong>8 August 2026</strong></p>
        <section><h2>1. Using SalarySabi</h2><p>SalarySabi is independently owned and operated by Ozichi Nwosu from Maryland, United States. You may use SalarySabi for lawful personal and business-information purposes. Do not misuse the service, attempt unauthorised access, interfere with its operation, or submit unlawful, misleading or harmful content.</p></section>
        <section><h2>2. Estimates, not tax advice</h2><p>Calculator results are educational estimates based on the information you enter and the rules identified on the methodology page. They are not tax advice, an assessment, a tax return, proof of filing or proof of payment.</p><p>Check important decisions with the relevant revenue authority or a qualified Nigerian tax professional.</p></section>
        <section><h2>3. Job listings</h2><p>Job information may be supplied by employers, recruiters or public sources. SalarySabi reviews listings but does not guarantee that every listing is complete, current or error-free. Applying does not create an employment relationship with SalarySabi.</p></section>
        <section><h2>4. Payroll workspace</h2><p>The payroll workspace calculates estimates and prepares records from information supplied by the employer. SalarySabi does not move salary funds, file returns, remit PAYE or pension contributions, verify employee records, or act as an accountant or payroll agent. Employers remain responsible for reviewing calculations, protecting account access, paying employees and meeting every filing and remittance obligation.</p></section>
        <section><h2>5. Accounts and submitted information</h2><p>You are responsible for information submitted through your account and for protecting access to it. Our handling of personal information is described in the <Link href="/privacy">privacy notice</Link>.</p></section>
        <section><h2>6. Availability and changes</h2><p>We may correct, improve, suspend or remove parts of the service. Tax rules and official guidance may change, so check the verification date and <Link href="/tax-updates">tax changelog</Link> before relying on an estimate.</p></section>
        <section><h2>7. Intellectual property</h2><p>SalarySabi&apos;s brand, interface and original content belong to SalarySabi or their respective licensors. Official legislation and public documents remain the property of their publishers.</p></section>
        <section><h2>8. Liability</h2><p>To the extent permitted by applicable law, SalarySabi is not responsible for losses caused by incorrect inputs, unsupported circumstances, third-party content, service interruption, or decisions made from an estimate.</p></section>
        <section><h2>9. Governing law</h2><p>These terms are governed by the laws of the State of Maryland, United States, without regard to its conflict-of-law principles. Nothing in these terms removes any consumer or other legal rights that cannot be waived under the laws that apply to you.</p></section>
        <section><h2>10. Contact</h2><p>Questions about these terms can be sent to <a href="mailto:hello@salarysabi.com?subject=Terms%20question">hello@salarysabi.com</a>. Do not include sensitive salary, payroll or identity information.</p></section>
      </div>
    </InfoPage>
  );
}
