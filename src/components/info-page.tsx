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
        <Link href="/">Calculate</Link>
        <Link className="nav-primary" href="/jobs">Find jobs</Link>
        <Link href="/account">My jobs</Link>
        <Link className="nav-cta" href="/how-paye-is-calculated">PAYE guide</Link>
      </nav>
      <div className="mobile-nav">
        <Link href="/">Calculate</Link>
        <Link href="/jobs">Jobs</Link>
        <details>
          <summary>Menu</summary>
          <div>
            <Link href="/account">My jobs</Link>
            <Link href="/post-a-job">Post a job</Link>
            <Link href="/suggest-a-job">Send us a job</Link>
            <Link href="/how-paye-is-calculated">PAYE guide</Link>
          </div>
        </details>
      </div>
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
        <Link href="/post-a-job">Post a job</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/disclaimer">Disclaimer</Link>
      </div>
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
