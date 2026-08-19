import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Contact SalarySabi",
  description: "Contact SalarySabi about tax corrections, product feedback, privacy or security.",
  alternates: { canonical: "/contact" },
};

const contacts = [
  ["General questions", "hello@salarysabi.com", "SalarySabi question"],
  ["Tax corrections or professional review", "tax@salarysabi.com", "PAYE review"],
  ["Privacy requests", "privacy@salarysabi.com", "Privacy request"],
  ["Security reports", "security@salarysabi.com", "Security report"],
] as const;

export default function ContactPage() {
  return (
    <InfoPage title="Contact SalarySabi">
      <div className="contact-page contact-page-simple">
        <section className="contact-options" aria-label="Contact options">
          {contacts.map(([title, email, subject]) => (
            <article key={title}>
              <h2>{title}</h2>
              <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}>{email}</a>
            </article>
          ))}
        </section>

        <p className="contact-safety">Do not email payslips, passwords, bank details or payroll records.</p>

        <nav className="contact-links" aria-label="Contact information">
          <Link href="/about">About SalarySabi</Link>
          <Link href="/privacy">Privacy notice</Link>
          <Link href="/tax-updates">Tax update history</Link>
        </nav>
      </div>
    </InfoPage>
  );
}
