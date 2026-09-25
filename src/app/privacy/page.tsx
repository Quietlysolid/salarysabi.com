import type { Metadata } from "next";
import Link from "next/link";
import { InfoFooter } from "@/components/info-page";
import { GatewayHeader } from "@/components/split-gateway-home";

export const metadata: Metadata = {
  title: "Privacy Notice | SalarySabi",
  description: "How SalarySabi handles calculator inputs, salary reports, payroll, job listings, accounts and website data.",
  alternates: { canonical: "/privacy" },
};

const contents = [
  { href: "#overview", label: "At a glance" },
  { href: "#information", label: "Information we handle" },
  { href: "#choices", label: "Your choices and rights" },
  { href: "#retention", label: "Retention" },
  { href: "#providers", label: "Who handles your information" },
  { href: "#purposes", label: "Why we use your information" },
  { href: "#contact", label: "Contact" },
];
const disclosures = [
  { title: "Calculator and payslip checks", data: "Gross pay, deductions, rent and PAYE figures you enter.", use: "Calculations run in your browser. The homepage preview saves the salary in session storage when you continue to the calculator. The payslip checker can also use figures previously saved in browser storage. These figures are not included in usage analytics or page addresses.", choice: "Clear this site's browser storage to remove saved figures; this can also sign you out. Closing a tab is not a reliable way to erase them." },
  { title: "Downloads", data: "The results and records you choose to export.", use: "PDFs and spreadsheets are created in your browser. Payroll exports use records retrieved from your private workspace. Downloaded files remain on the device or storage destination you choose.", choice: "Protect and delete your downloaded files yourself; deleting an online record does not remove copies you downloaded or shared." },
  { title: "Accounts and job-search records", data: "Email address, authentication credentials and session information; saved jobs, application statuses and alert preferences.", use: "Supabase handles authentication. Your account stores saved jobs and application statuses. Recording a status does not send an application to an employer. Authentication uses browser storage to maintain your session; the job board also caches public listings locally.", choice: "Remove saved jobs in your account. Signing out does not delete account records. See Your choices and rights for closure and deletion requests." },
  { title: "Payroll", data: "Business name, employee names and numbers, optional email addresses, pay figures, deductions and payroll-run records.", use: "Supabase stores records for the employer's signed-in workspace, payroll history and payslips. They are not published or sent in product-analytics events. Administrative access is separate from employer access.", choice: "Provide only information needed for payroll. Deactivating an employee does not delete historical payroll runs." },
  { title: "Salary community", data: "Role, industry, work location, experience band, company-size band, monthly gross salary, pay reliability and the month that salary applied.", use: "Individual reports are stored for review, not published. Comparisons require at least five distinct report combinations from the current month and previous 11 months. Reports must be approved for publication. Matching role, industry, location, experience, salary and reporting month count once; this is not a count of verified people. Older or undated reports are excluded. Grouping does not guarantee anonymity.", choice: "Sharing is optional. Do not enter identifying details. The form does not collect your identity, so we may be unable to identify your report for correction or deletion." },
  { title: "Job submissions and hiring", data: "Contact email, role and company details, location, advertised pay and application information. Signed-in submissions can be linked to your account.", use: "Approved job details and application links are published; the separate submission contact email is not. Your hiring workspace shows linked submissions and their status. External application sites have their own privacy notices.", choice: "Use the contact below for corrections or removal. Do not put private details in fields intended for publication." },
  { title: "Job alerts", data: "Account-linked email address, search filters, active status, delivery records and an unsubscribe token.", use: "Search filters select matching jobs for emails sent through the configured Supabase and Cloudflare integration. Delivery depends on the service being enabled and matching jobs being available.", choice: "The email unsubscribe link disables the alert and keeps its delivery history. Deleting an alert in your account also deletes its linked delivery records from the application database; provider logs and backups are separate." },
  { title: "Product analytics", data: "Selected actions, pages visited and the website that referred you.", use: "Production analytics sends only the event name, public page path and referring domain to the counting service. Supabase groups these into daily counts. Salary figures, form entries, IP addresses and persistent visitor IDs are not included in these counts.", choice: "Analytics is skipped when Do Not Track or the browser's data-saving preference is enabled. The controls below let you opt out in this browser; hosting and security processing continue." },
  { title: "Hosting and security", data: "Request information such as IP address, browser information, requested address and operational or security events.", use: "Cloudflare and Supabase handle requests, sign-in and service security. The analytics endpoint uses the request IP to limit excessive requests when its rate-limit binding is configured. These operations are separate from usage counts.", choice: "Request processing is needed to serve the site. Do not put sensitive information in page addresses." },
  { title: "Messages and privacy requests", data: "Your email address and information you choose to send us.", use: "Your email and its contents are used to answer your request and investigate the issue.", choice: "Send only what is needed. Do not email passwords, sign-in codes, payslips or identity documents." },
];
function PrivacyLinks() { return <nav aria-label="Privacy sections">{contents.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>; }

export default function PrivacyPage() {
  return <div className="split-gateway-shell terms-page-shell privacy-document-shell">
    <GatewayHeader />
    <main id="main-content" tabIndex={-1}><div className="terms-document">
      <header className="terms-heading"><h1>Privacy notice</h1><p className="terms-date">Last updated: <strong>24 September 2026</strong></p><p>How we handle your information and the choices you have.</p></header>
      <aside className="terms-sidebar"><strong>On this page</strong><PrivacyLinks /></aside>
      <details className="terms-mobile-contents"><summary>On this page</summary><PrivacyLinks /></details>
      <article className="terms-body" aria-label="Privacy notice">
        <section id="overview" className="terms-at-a-glance"><h2>At a glance</h2><ul>
          <li><strong>Pay tools calculate in your browser.</strong> Figures can be saved on your device to carry them between tools.</li>
          <li><strong>Community comparisons are grouped.</strong> Individual salary reports are stored for review, not published as individual records.</li>
          <li><strong>Approved job details are public.</strong> Account and payroll records are not published.</li>
        </ul></section>
        <div className="terms-full-text">
          <section id="information"><h2>Information we handle</h2><p>Choose a feature for details.</p><div className="privacy-feature-list">{disclosures.map(item => <details key={item.title}><summary>{item.title}</summary><div><h3>Information</h3><p>{item.data}</p><h3>How it is used</h3><p>{item.use}</p><h3>Your choice</h3><p>{item.choice}</p></div></details>)}</div></section>
          <section id="choices"><h2>Your choices and rights</h2><p>Depending on applicable law, you may request access, correction, deletion, restriction or a portable copy of your personal information, object to certain processing, and withdraw consent where processing relies on it. These rights may have exceptions; withdrawing consent does not undo processing already lawfully carried out.</p><p><Link href="/account">Manage saved jobs and alerts</Link>, or email <a href="mailto:privacy@salarysabi.com?subject=Privacy%20request">privacy@salarysabi.com</a> for other requests. We may need to verify your identity or authority before acting. Do not send employee records as proof of identity.</p><p><a href="/privacy?analytics=off">Turn off product analytics in this browser</a> or <a href="/privacy?analytics=on">turn it back on</a>. The preference uses local storage and is lost if you clear that storage.</p><p>For employee payroll records, contact your employer first where possible; they determine why those records are provided. You can also contact us about our handling. You may raise a complaint with the <a href="https://ndpc.gov.ng/">Nigeria Data Protection Commission</a> or another competent authority.</p></section>
          <section id="retention"><h2>Retention</h2><p>Browser storage can survive closing a tab, including restored sessions. Downloaded files remain until you delete them.</p><p>Job-form drafts are saved in session storage in the browser tab as you type, including contact details. Use the Discard draft button to clear them; successful submission also clears the draft. Browser session restoration may retain drafts. The application has no general automatic expiry for account, submission or payroll records. Salary reports age out of recent comparisons without being deleted.</p><p>Provider log and backup retention periods have not yet been confirmed for this notice. Deleting an application record does not establish when provider copies expire. Legal obligations or security investigations may also limit deletion.</p></section>
          <section id="providers">
            <h2>Who handles your information</h2>
            <p>SalarySabi is operated by Ozichi Nwosu in Maryland, United States.</p>
            <ul>
              <li><strong>Supabase</strong> stores account and submitted information and handles sign-in.</li>
              <li><strong>Cloudflare</strong> hosts and protects the website and supports job-alert emails.</li>
              <li><strong>Email providers</strong> process messages you send us.</li>
            </ul>
            <p>Information may be processed outside Nigeria through our US administration and our providers’ infrastructure.</p>
            <p>Their published terms describe security and international-transfer commitments. SalarySabi has not yet completed verification of the transfer arrangements for each service.</p>
            <p>Provider terms: <a href="https://supabase.com/legal/customer-resources/data-processing-addendum">Supabase</a> and <a href="https://www.cloudflare.com/cloudflare-customer-dpa/">Cloudflare</a>.</p>
          </section>
          <section id="purposes">
            <h2>Why we use your information</h2>
            <p>The feature sections above explain each use of your information.</p>
            <p>The legal basis for each activity has not yet been fully documented for this notice. We cannot describe every use as consent-based simply because information is submitted. See <a href="#choices">your choices and rights</a>.</p>
            <p>Employers must have a lawful basis for sharing employee information. SalarySabi remains responsible for its own handling of that information.</p>
          </section>
          <section id="contact"><h2>Contact</h2><p>Email <a href="mailto:privacy@salarysabi.com">privacy@salarysabi.com</a> with the feature and your question or request. To report a security issue, use our <Link href="/security">security reporting guidance</Link>.</p><p>We will update this notice when our handling changes. The date above identifies this revision. See our <Link href="/terms">terms of use</Link> for service responsibilities.</p></section>
        </div>
      </article>
    </div></main>
    <InfoFooter />
  </div>;
}
