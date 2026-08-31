import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, FileText, MonitorCheck } from "lucide-react";
import { PublicPageShell } from "@/components/info-page";
import { legalContentUpdatedDate } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Notice | SalarySabi",
  description: "See how SalarySabi handles calculator entries, anonymous salary reports, reward details, payroll records, analytics and other information you submit.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const disclosures = [
  {
    title: "Calculator information",
    data: "Salary, allowances, deductions and calculation inputs",
    happens:
      "Processed in browser memory to perform PAYE calculations. Not placed in the page URL, and no account or calculation history is created.",
    processor: "You, on your device. No calculator data leaves your browser.",
    choice: "Close the tab to clear inputs from memory.",
  },
  {
    title: "PDF and spreadsheet exports",
    data: "The calculation results you choose to export",
    happens:
      "PDF and spreadsheet-compatible files are generated locally for you to download.",
    processor: "You, on your device. Files are not uploaded to a document service.",
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
    title: "Anonymous salary reports",
    data: "Role, industry, work location, experience band, company-size band, monthly gross salary and pay reliability",
    happens:
      "Stored privately for review. An approved report contributes only to a grouped salary range after at least five similar reports are approved. Your individual report is not published.",
    processor: "SalarySabi reviewers; the private database is operated by Supabase.",
    choice: "Submitting is optional. Do not enter your name or employer, and contact us to request deletion.",
  },
  {
    title: "Reward access and payout",
    data: "Sign-in email; protected submission signals; and, only when you request payment, your payout method and destination",
    happens:
      "Your email provides access to the reward claim. A human-verification result and keyed, non-readable fingerprints derived from the submission, network and browser installation help detect duplicates and coordinated reward abuse. Raw IP addresses and browser details are not stored in contributor claims. Network and browser fingerprints are cleared after 90 days. Short source excerpts are removed after 180 days. Payout details are used to review and process payment; a protected comparison of normalized destinations helps prevent one person claiming through multiple accounts. None of these details enter public salary comparisons.",
    processor: "SalarySabi administrators; authentication and private records are operated through Supabase.",
    choice: "You can share without claiming a reward, or contact us to request deletion of submitted details.",
  },
  {
    title: "Hosting technical logs",
    data: "IP address, browser type and requested page",
    happens:
      "Used to deliver, secure and keep the service reliable. We do not copy raw IP addresses into our analytics database or contributor records.",
    processor: "SalarySabi’s hosting provider, for operational and security purposes.",
    choice: "Essential service logs cannot be disabled.",
  },
  {
    title: "Privacy-friendly analytics",
    data: "Grouped page views and selected product actions",
    happens:
      "Counts page visits, calculations, payslip checks, exports and selected job actions. No cookies, persistent identifiers, salary figures, payslip values, form text or browser fingerprints are collected.",
    processor: "SalarySabi using aggregated Supabase data.",
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
  {
    title: "Tax-update alerts",
    data: "Email address, consent date and signup source",
    happens: "Used only to notify you when an official Nigerian PAYE rule change affects the calculator. Calculator figures are not attached.",
    processor: "SalarySabi; the private database is operated by Supabase.",
    choice: "Unsubscribe from an alert or ask us to remove your details at any time.",
  },
];

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <article className="privacy-page">
        <header className="privacy-hero">
          <h1>Privacy</h1>
        </header>

        <section className="privacy-trust" aria-label="Privacy at a glance">
          <div>
            <MonitorCheck aria-hidden="true" />
            <span><strong>Calculator stays on your device</strong>Your salary figures are not saved.</span>
          </div>
          <div>
            <BarChart3 aria-hidden="true" />
            <span><strong>Salary reports are grouped</strong>Individual reports are never published.</span>
          </div>
          <div>
            <FileText aria-hidden="true" />
            <span><strong>Stored records stay private</strong>Payroll, alerts and rewards require information you choose to submit.</span>
          </div>
        </section>

        <section className="privacy-details" id="details" aria-labelledby="privacy-details-heading">
          <div className="privacy-details-heading"><h2 id="privacy-details-heading">How your information is handled</h2></div>
          <div className="privacy-ledger privacy-activity-list">
          {disclosures.map((item) => (
            <details className="privacy-ledger-row" key={item.title}>
              <summary>
                <span><strong>{item.title}</strong><small>{item.data}</small></span>
                <span className="privacy-activity-toggle" aria-hidden="true">+</span>
              </summary>
              <div className="privacy-activity-details">
                <div><strong>What happens</strong><p>{item.happens}</p></div>
                <div><strong>Who handles it</strong><p>{item.processor}</p></div>
                <div><strong>Your choice</strong><p>{item.choice}</p></div>
              </div>
            </details>
          ))}
          </div>
        </section>

        <footer className="privacy-actions" id="privacy-choices">
          <p>Last updated: <strong>{legalContentUpdatedDate}</strong></p>
          <div>
            <a className="privacy-request-action" href="mailto:privacy@salarysabi.com?subject=Privacy%20request">Request an update or deletion</a>
            <Link className="privacy-return-action" href="/payslip-checker">Return to pay checker</Link>
          </div>
        </footer>
      </article>
    </PublicPageShell>
  );
}
