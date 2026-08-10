import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { BrandWordmark } from "@/components/brand-wordmark";
import { SiteNavigation } from "@/components/site-navigation";

export function InfoHeader() {
  return (
    <header className="site-header info-header">
      <Link aria-label="SalarySabi home" className="brand" href="/">
        <BrandMark />
        <BrandWordmark />
      </Link>
      <SiteNavigation />
      <div className="mobile-nav">
        <Link href="/">Calculate</Link>
        <Link href="/payslip-checker">Check payslip</Link>
        <details>
          <summary>Menu</summary>
          <div>
            <Link href="/paye-guide">PAYE guide</Link>
            <Link href="/tax-updates">Tax updates</Link>
            <Link href="/payroll">Employer payroll</Link>
            <Link href="/jobs">Jobs with salaries</Link>
            <Link href="/account">My job workspace</Link>
            <Link href="/post-a-job">Employers: Post a job</Link>
            <Link href="/suggest-a-job">Job seekers: Share a job</Link>
          </div>
        </details>
      </div>
    </header>
  );
}

export function InfoFooter() {
  return (
    <footer className="info-footer">
      <div className="footer-identity">
        <Link aria-label="SalarySabi home" className="brand footer-brand" href="/">
          <BrandMark />
          <BrandWordmark />
        </Link>
        <p>Know your PAYE. See how it is calculated.</p>
      </div>
      <div className="footer-links">
        <nav aria-labelledby="footer-pay-tools">
          <h2 id="footer-pay-tools">Pay tools</h2>
          <Link href="/#calculator">Calculate PAYE</Link>
          <Link href="/payslip-checker">Check payslip</Link>
          <Link href="/paye-guide">PAYE guide</Link>
          <Link href="/payroll">Run payroll</Link>
          <Link href="/tax-news">Tax news</Link>
        </nav>
        <nav aria-labelledby="footer-jobs">
          <h2 id="footer-jobs">Jobs</h2>
          <Link href="/jobs">Jobs with salaries</Link>
          <Link href="/account">My job workspace</Link>
          <Link href="/post-a-job">For employers</Link>
        </nav>
        <nav aria-labelledby="footer-salarysabi">
          <h2 id="footer-salarysabi">Trust & support</h2>
          <Link href="/about">About</Link>
          <Link href="/tax-updates">Tax updates</Link>
          <a href="mailto:hello@salarysabi.com?subject=SalarySabi%20contact">Contact</a>
          <a href="mailto:tax@salarysabi.com?subject=Tax%20rule%20correction">Report a tax issue</a>
        </nav>
        <nav aria-labelledby="footer-legal">
          <h2 id="footer-legal">Legal</h2>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/disclaimer">Disclaimer</Link>
          <Link href="/security">Security</Link>
          <Link href="/accessibility">Accessibility</Link>
        </nav>
      </div>
      <p className="footer-legal-line">© 2026 SalarySabi.</p>
    </footer>
  );
}

export function PublicPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={className}>
      <InfoHeader />
      {children}
      <InfoFooter />
    </main>
  );
}

export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
  contents,
  trail,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  contents?: { href: string; label: string }[];
  trail?: ReactNode;
}) {
  return (
    <PublicPageShell>
      {trail}
      <article className="info-page">
        <div className="info-hero">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        {contents && contents.length > 0 && (
          <nav className="info-contents" aria-label="On this page">
            <strong>On this page</strong>
            <div>
              {contents.map((item, index) => (
                <a href={item.href} key={item.href}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        )}
        <div className="prose">{children}</div>
      </article>
    </PublicPageShell>
  );
}
