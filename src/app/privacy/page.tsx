import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How SalarySabi handles calculator information and site data.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy"
      title="Your salary figures stay in your browser"
      intro="The current calculator performs PAYE calculations on your device. Salary and deduction figures are not submitted to our server."
    >
      <section>
        <h2>Calculator information</h2>
        <p>
          Values entered into the calculator are processed in browser memory.
          They are not placed in the page URL, and the current version does not
          create an account or save calculation history.
        </p>
      </section>
      <section>
        <h2>Exports</h2>
        <p>
          PDF and Excel-compatible files are generated on your device. Export
          data is not uploaded to an external document service.
        </p>
      </section>
      <section>
        <h2>Hosting and technical logs</h2>
        <p>
          The hosting provider may process ordinary technical logs such as IP
          address, browser type and requested page to deliver, secure and keep
          the service reliable. We do not copy IP addresses into our analytics
          database.
        </p>
      </section>
      <section>
        <h2>Privacy-friendly analytics</h2>
        <p>
          We count page views and a small set of product actions: calculations,
          PDF exports, Excel exports and print actions. Counts are grouped by
          date, page and referring website. We do not use analytics cookies,
          persistent visitor identifiers, salary figures, deduction figures or
          browser fingerprints. Browser “Do Not Track” is respected.
        </p>
      </section>
      <section>
        <h2>Job submissions</h2>
        <p>
          Employers who submit a job provide a contact email and job details.
          We keep the contact email private and use it to review the listing or
          ask questions about it. Approved job details, excluding the contact
          email, may be published on SalarySabi.
        </p>
      </section>
      <section>
        <h2>Job alerts</h2>
        <p>
          A job alert stores your email address and the job filters you select.
          We use them only to send matching job notifications. You may ask us
          to deactivate and remove the alert.
        </p>
      </section>
      <section>
        <h2>Early-access email</h2>
        <p>
          If you join an early-access list, we store your email address,
          the date you consented and the signup source in a private database
          operated by Supabase. We use it only to send the launch update you
          requested. You may ask us to remove it at any time.
        </p>
      </section>
    </InfoPage>
  );
}
