import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Security and Data Protection | SalarySabi",
  description: "How SalarySabi protects calculator data and how to report a security issue.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return <InfoPage eyebrow="Security" title="Your salary data needs clear boundaries." intro="Personal PAYE calculations run in your browser. Employer payroll records are stored only for authenticated payroll workspaces.">
    <div className="legal-sections">
      <section><h2>Personal calculator data stays in your browser</h2><p>Salary, deduction and payslip-checker values entered in the public tools are calculated on your device. They are not added to page URLs or stored in a SalarySabi calculation-history database.</p><p>Closing the tab clears values held in memory. Your browser may keep the current calculator context locally so you can move between SalarySabi guides and return to the form.</p></section>
      <section><h2>Payroll workspaces store employer records</h2><p>When an authenticated employer uses payroll, SalarySabi stores the business, employee, pay, deduction and finalised-run records needed to provide that workspace. Database access is restricted to the account that owns the employer workspace.</p><p>Do not use the payroll workspace for identity documents, bank credentials, medical records or information that is not needed to calculate and document payroll.</p></section>
      <section><h2>Encrypted connection</h2><p>SalarySabi uses HTTPS. Production responses include transport, content, framing, MIME-type, referrer and browser-permission protections.</p><p>No badge can guarantee that a service is perfectly secure. We publish the controls we use and provide a direct reporting route instead.</p></section>
      <section><h2>Information you choose to submit</h2><p>Accounts, job alerts, employer submissions and contact requests require limited information to provide those services. The <Link href="/privacy">privacy notice</Link> explains what is collected and why.</p></section>
      <section><h2>Report a security issue</h2><p>Email <a href="mailto:security@salarysabi.com?subject=Security%20report">security@salarysabi.com</a> with the subject “Security report”. Describe the affected page, steps to reproduce and potential impact.</p><p>Do not access other users&apos; information, disrupt the service, use automated destructive testing, or include passwords, payslips or unnecessary personal information in your report.</p></section>
      <section><h2>Known limits</h2><p>SalarySabi does not currently operate a paid bug-bounty programme or promise a specific reward. Security controls reduce risk but cannot eliminate every possible vulnerability.</p></section>
    </div>
  </InfoPage>;
}
