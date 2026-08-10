import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, FileText, MonitorCheck } from "lucide-react";
import { PublicPageShell } from "@/components/info-page";
import { legalContentUpdatedDate } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Notice | SalarySabi",
  description: "See how SalarySabi handles calculator entries, payroll records, exports, analytics, job alerts and information you choose to submit.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const disclosures = [
  {
    title: "Calculator information",
    data: "Salary, allowances, deductions and calculation inputs",
    happens:
      "Processed in browser memory to perform PAYE calculations. Not placed in the page URL, and no account or calculation history is created.",
    processor: "You — on your device. No calculator data leaves your browser.",
    choice: "Close the tab to clear inputs from memory.",
  },
  {
    title: "PDF and spreadsheet exports",
    data: "The calculation results you choose to export",
    happens:
      "PDF and spreadsheet-compatible files are generated locally for you to download.",
    processor: "You — on your device. Files are not uploaded to a document service.",
    choice: "Download or do not download; delete saved files whenever you choose.",
  },
  {
    title: "Employer payroll workspace",
    data: "Business name, employee names, employee numbers, optional email addresses, pay figures, deductions and payroll-run records",
    happens:
      "Stored so an authenticated employer can prepare payroll, keep monthly records and generate payslips. These records are not used for advertising or public analytics.",
    processor: "SalarySabi; the private database and authentication service are operated by Supabase.",
    choice: "The employer controls the records in its workspace and may request account or payroll-data deletion.",
  },
  {
    title: "Hosting technical logs",
    data: "IP address, browser type and requested page",
    happens:
      "Used to deliver, secure and keep the service reliable. We do not copy IP addresses into our analytics database.",
    processor: "SalarySabi’s hosting provider, for operational and security purposes.",
    choice: "Essential service logs cannot be disabled.",
  },
  {
    title: "Privacy-friendly analytics",
    data: "Grouped page views and selected product actions",
    happens:
      "Counts page visits, calculations, payslip checks, exports and selected job actions. No cookies, persistent identifiers, salary figures, payslip values, form text or browser fingerprints are collected.",
    processor: "SalarySabi using aggregated Supabase data, with privacy-restricted PostHog event reporting when configured.",
    choice: "Browser Do Not Track is respected.",
  },
  {
    title: "Job submissions",
    data: "Contact email and the job details an employer submits",
    happens:
      "Used to review a listing or ask questions. Approved job details may be published, but the contact email stays private.",
    processor: "SalarySabi’s job review team.",
    choice: "Request an update or removal by contacting us.",
  },
  {
    title: "Job alerts",
    data: "Email address and selected job filters",
    happens: "Used only to send matching job notifications.",
    processor: "SalarySabi and the service used to deliver the alert.",
    choice: "Ask us to deactivate and remove the alert.",
  },
  {
    title: "Early-access email",
    data: "Email address, consent date and signup source",
    happens: "Used only to send the launch update you requested.",
    processor: "SalarySabi; the private database is operated by Supabase.",
    choice: "Ask us to remove your details at any time.",
  },
];

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <article className="privacy-page">
        <header className="privacy-hero">
          <span className="eyebrow">Privacy</span>
          <h1>Privacy, in plain language</h1>
          <p>Personal calculator figures stay in your browser. Employer payroll records are stored only when an account holder uses the payroll workspace.</p>
        </header>

        <nav className="privacy-page-nav" aria-label="Privacy page sections">
          <strong>On this page</strong>
          <a href="#short-version">The short version</a>
          <a href="#details">Complete details</a>
          <a href="#privacy-choices">Your privacy choices</a>
        </nav>

        <section className="privacy-trust" aria-label="Privacy at a glance">
          <div>
            <MonitorCheck aria-hidden="true" />
            <span><strong>Personal calculator: on device</strong>Figures are calculated in your browser.</span>
          </div>
          <div>
            <BarChart3 aria-hidden="true" />
            <span><strong>Analytics: no cookies</strong>We use grouped, privacy-friendly analytics.</span>
          </div>
          <div>
            <FileText aria-hidden="true" />
            <span><strong>Exports: local</strong>Files are generated on your device.</span>
          </div>
        </section>

        <section className="privacy-summary" id="short-version" aria-labelledby="privacy-summary-heading">
          <div><span className="eyebrow">The short version</span><h2 id="privacy-summary-heading">Five things to know</h2><p>These answers cover the most common privacy questions. The complete disclosure remains below.</p></div>
          <ol>
            <li><span>01</span><div><strong>Your salary stays on your device</strong><p>Calculator inputs and exports are processed locally. SalarySabi does not create a salary history.</p></div></li>
            <li><span>02</span><div><strong>Payroll records are different</strong><p>Authenticated employers choose to store employee and pay records so the payroll workspace can keep monthly history.</p></div></li>
            <li><span>03</span><div><strong>Using jobs or alerts requires limited details</strong><p>SalarySabi receives information only when you submit a listing, create an alert or request an update.</p></div></li>
            <li><span>04</span><div><strong>Analytics does not include salary figures</strong><p>Grouped usage counts help improve the product without cookies, persistent IDs or browser fingerprints.</p></div></li>
            <li><span>05</span><div><strong>You can ask for removal</strong><p>Email the privacy address to update or delete information you deliberately submitted.</p></div></li>
          </ol>
        </section>

        <section className="privacy-details" id="details" aria-labelledby="privacy-details-heading">
          <div className="privacy-details-heading"><span className="eyebrow">Complete reference</span><h2 id="privacy-details-heading">What happens to each type of information</h2><p>Scan by activity. If you never use a feature, its submitted-information row does not apply to you.</p></div>
          <div className="privacy-ledger">
          <div className="privacy-ledger-head" aria-hidden="true">
            <span>Data or activity</span>
            <span>What happens</span>
            <span>Who processes it</span>
            <span>Your choice</span>
          </div>
          {disclosures.map((item) => (
            <article className="privacy-ledger-row" key={item.title}>
              <div><strong>{item.title}</strong><span>{item.data}</span></div>
              <div data-label="Use"><p>{item.happens}</p></div>
              <div data-label="Handled by"><p>{item.processor}</p></div>
              <div data-label="Your control"><p>{item.choice}</p></div>
            </article>
          ))}
          </div>
        </section>

        <footer className="privacy-actions" id="privacy-choices">
          <p>Last updated: <strong>{legalContentUpdatedDate}</strong></p>
          <div>
            <a className="privacy-request-action" href="mailto:privacy@salarysabi.com?subject=Privacy%20request">Request an update or deletion</a>
            <Link className="privacy-return-action" href="/#calculator">Return to calculator</Link>
          </div>
        </footer>
      </article>
    </PublicPageShell>
  );
}
