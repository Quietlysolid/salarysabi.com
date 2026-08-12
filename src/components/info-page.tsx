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
        <Link href="/tax-tools">Calculate</Link>
        <Link href="/payslip-checker">Check payslip</Link>
        <details>
          <summary>Menu</summary>
          <div>
            <Link href="/salaries-and-jobs">Salaries & jobs</Link>
            <Link href="/business">For businesses</Link>
            <Link href="/paye-guide">Learn about PAYE</Link>
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
        <p>Know what you earn, what you owe and what you keep.</p>
      </div>
      <div className="footer-links">
        <nav aria-labelledby="footer-pay-tools">
          <h2 id="footer-pay-tools">Calculate</h2>
          <Link href="/tax-tools">All calculators</Link>
          <Link href="/#calculator">Employee PAYE</Link>
          <Link href="/payslip-checker">Check payslip</Link>
        </nav>
        <nav aria-labelledby="footer-jobs">
          <h2 id="footer-jobs">Salaries & jobs</h2>
          <Link href="/salaries">Salary benchmarks</Link>
          <Link href="/jobs">Jobs with salaries</Link>
          <Link href="/account">Job workspace</Link>
        </nav>
        <nav aria-labelledby="footer-salarysabi">
          <h2 id="footer-salarysabi">For businesses</h2>
          <Link href="/payroll">Small-team payroll</Link>
          <Link href="/company-tax">Company tax</Link>
          <Link href="/post-a-job">Post a job</Link>
        </nav>
        <nav aria-labelledby="footer-learn">
          <h2 id="footer-learn">Learn & trust</h2>
          <Link href="/paye-guide">PAYE guide</Link>
          <Link href="/tax-updates">Tax updates</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/about">About SalarySabi</Link>
        </nav>
      </div>
      <p className="footer-legal-line"><span>© 2026 SalarySabi.</span><span><Link href="/terms">Terms</Link><Link href="/disclaimer">Disclaimer</Link><Link href="/security">Security</Link><Link href="/accessibility">Accessibility</Link></span></p>
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
