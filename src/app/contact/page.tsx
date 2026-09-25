import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Contact SalarySabi",
  description: "Contact SalarySabi about tax corrections, product feedback, privacy or security.",
  alternates: { canonical: "/contact" },
};

const contacts = [
  ["Tax corrections", "tax@salarysabi.com", "PAYE review"],
  ["Privacy requests", "privacy@salarysabi.com", "Privacy request"],
  ["Security reports", "security@salarysabi.com", "Security report"],
] as const;

export default function ContactPage() {
  return (
    <InfoPage title="Contact SalarySabi">
      <div className="contact-page contact-page-simple">
        <section className="contact-general" aria-labelledby="contact-general-title">
          <h2 id="contact-general-title">Questions or feedback?</h2>
          <a href="mailto:hello@salarysabi.com?subject=SalarySabi%20question">hello@salarysabi.com</a>
        </section>
        <section className="contact-specialists" aria-label="Specialist contacts">
          {contacts.map(([title, email, subject]) => (
            <article key={title}>
              <h2>{title}</h2>
              <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}>{email}</a>
              {title === "Security reports" && <p><Link href="/security">How to report a security issue</Link></p>}
            </article>
          ))}
        </section>

        <p className="contact-safety">Do not email payslips, passwords, bank details or payroll records.</p>


      </div>
    </InfoPage>
  );
}
