import type { ReactNode } from "react";
import Link from "next/link";
import { lastVerified } from "@/lib/site";

export function InfoHeader() {
  return (
    <header className="site-header info-header">
      <Link className="brand" href="/">
        <span className="brand-mark">§</span>
        <span>
          Salary<span className="brand-accent">Sabi</span>
        </span>
      </Link>
      <nav aria-label="Information navigation">
        <Link className="nav-primary" href="/jobs">Jobs</Link>
        <Link href="/account">My jobs</Link>
        <Link href="/how-paye-is-calculated">Methodology</Link>
        <Link href="/eligible-deductions">Deductions</Link>
        <Link className="nav-cta" href="/#calculator">
          Open calculator
        </Link>
      </nav>
    </header>
  );
}

export function InfoFooter() {
  return (
    <footer className="info-footer">
      <Link className="brand footer-brand" href="/">
        <span className="brand-mark">§</span>
        <span>
          Salary<span className="brand-accent">Sabi</span>
        </span>
      </Link>
      <div className="footer-links">
        <Link href="/account">My jobs</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/disclaimer">Disclaimer</Link>
        <a
          href="https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf"
          rel="noreferrer"
          target="_blank"
        >
          Official JRB guidance
          <span className="external-arrow" aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <span>Calculation rules last verified {lastVerified}</span>
    </footer>
  );
}

export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main>
      <InfoHeader />
      <article className="info-page">
        <div className="info-hero">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <div className="verified-note">
            <span>Verified:</span>
            Rules checked {lastVerified}
          </div>
        </div>
        <div className="prose">{children}</div>
      </article>
      <InfoFooter />
    </main>
  );
}
