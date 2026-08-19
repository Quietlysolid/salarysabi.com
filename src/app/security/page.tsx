import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Security and Data Protection | SalarySabi",
  description: "How SalarySabi protects calculator data and how to report a security issue.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return <InfoPage title="Security">
    <div className="legal-sections security-sections">
      <section><h2>Calculator data stays on your device</h2><p>Public calculators do not send salary or deduction figures to SalarySabi.</p></section>
      <section><h2>Payroll records require an account</h2><p>Employer payroll records are stored privately and limited to the workspace owner.</p></section>
      <section><h2>Connections are encrypted</h2><p>SalarySabi uses HTTPS and standard browser security protections.</p></section>
      <section><h2>Information you submit</h2><p>Accounts, alerts and job submissions use only the information needed for those features. See the <Link href="/privacy">privacy notice</Link>.</p></section>
      <section><h2>Report a security issue</h2><p>Email <a href="mailto:security@salarysabi.com?subject=Security%20report">security@salarysabi.com</a>. Include the affected page, steps and potential impact. Do not include passwords, payslips or unnecessary personal information.</p></section>
    </div>
  </InfoPage>;
}
