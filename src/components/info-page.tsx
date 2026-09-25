import type { ReactNode } from "react";
import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";
import { AudienceNavigation, MobileNavigation, SiteNavigation } from "@/components/site-navigation";

export function InfoHeader({ showAudienceNavigation = true }: { showAudienceNavigation?: boolean }) {
  return (
    <>
      <header className="site-header info-header">
        <Link aria-label="SalarySabi home" className="brand" href="/">
          <BrandWordmark />
        </Link>
        <SiteNavigation />
        <MobileNavigation />
      </header>
      {showAudienceNavigation && <AudienceNavigation />}
    </>
  );
}

export function InfoFooter() {
  return (
    <footer className="info-footer">
      <div className="footer-identity">
        <Link aria-label="SalarySabi home" className="brand footer-brand" href="/">
          <BrandWordmark />
        </Link>
      </div>
      <div className="footer-links">
        <nav aria-labelledby="footer-individuals">
          <h2 id="footer-individuals">For individuals</h2>
          <Link href="/calculator">Calculate my take-home</Link>
          <Link href="/calculator?mode=check">Check my payslip</Link>
          <Link href="/jobs">Find jobs with salaries</Link>
          <Link href="/salaries">Compare and share salaries</Link>
        </nav>
        <nav aria-labelledby="footer-employers">
          <h2 id="footer-employers">For employers</h2>
          <Link href="/payroll">Run payroll</Link>
          <Link href="/company-tax">Estimate company tax</Link>
          <Link href="/post-a-job">Post a job</Link>
          <Link href="/hiring">Manage my listings</Link>
        </nav>
        <nav aria-labelledby="footer-about">
          <h2 id="footer-about">About</h2>
          <Link href="/tax-updates">Calculation rules</Link>
          <Link href="/about">About SalarySabi</Link>
          <Link href="/contact">Contact us</Link>
        </nav>
      </div>
      <div className="footer-mobile-links" aria-label="Footer navigation">
        <details>
          <summary>For individuals</summary>
          <div>
            <Link href="/calculator">Calculate my take-home</Link>
          <Link href="/calculator?mode=check">Check my payslip</Link>
            <Link href="/jobs">Find jobs with salaries</Link>
          <Link href="/salaries">Compare and share salaries</Link>
          </div>
        </details>
        <details>
          <summary>For employers</summary>
          <div>
            <Link href="/payroll">Run payroll</Link>
            <Link href="/company-tax">Estimate company tax</Link>
            <Link href="/post-a-job">Post a job</Link>
          <Link href="/hiring">Manage my listings</Link>
          </div>
        </details>
        <details>
          <summary>About</summary>
          <div>
            <Link href="/tax-updates">Calculation rules</Link>
            <Link href="/about">About SalarySabi</Link>
            <Link href="/contact">Contact us</Link>
          </div>
        </details>
      </div>
      <p className="footer-legal-line">
        <span>© 2026 SalarySabi</span>
        <span>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/accessibility">Accessibility</Link>
        </span>
      </p>
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
    <div className={`public-page-shell${className ? ` ${className}` : ""}`}>
      <InfoHeader />
      <main className="public-page-main" id="main-content" tabIndex={-1}>{children}</main>
      <InfoFooter />
    </div>
  );
}

export function InfoPage({
  eyebrow,
  title,
  heroAction,
  children,
  contents,
  trail,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  heroAction?: ReactNode;
  children: ReactNode;
  contents?: { href: string; label: string }[];
  trail?: ReactNode;
}) {
  return (
    <PublicPageShell>
      {trail}
      <article className="info-page">
        <div className="info-hero">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {heroAction}
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
