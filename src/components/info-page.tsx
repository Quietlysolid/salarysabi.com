import type { ReactNode } from "react";
import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";
import { CampaignAnnouncement } from "@/components/campaign-announcement";
import { AudienceNavigation, MobileNavigation, SiteNavigation } from "@/components/site-navigation";

export function InfoHeader() {
  return (
    <>
      <header className="site-header info-header">
        <Link aria-label="SalarySabi home" className="brand" href="/">
          <BrandWordmark />
        </Link>
        <SiteNavigation />
        <MobileNavigation />
      </header>
      <AudienceNavigation />
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
        <p>From salary promise to take-home reality.</p>
      </div>
      <div className="footer-links">
        <nav aria-labelledby="footer-talent">
          <h2 id="footer-talent">For talent</h2>
          <Link href="/payslip-checker">Take-home pay</Link>
          <Link href="/payslip-checker">Check payslip PAYE</Link>
          <Link href="/salaries">Salary benchmarks</Link>
          <Link href="/jobs">Jobs with salaries</Link>
        </nav>
        <nav aria-labelledby="footer-employers">
          <h2 id="footer-employers">For employers</h2>
          <Link href="/payroll">Small-team payroll</Link>
          <Link href="/company-tax">Company tax</Link>
          <Link href="/post-a-job">Post a job</Link>
        </nav>
        <nav aria-labelledby="footer-community">
          <h2 id="footer-community">Contribute</h2>
          <Link href="/contributors">Contribute pay data</Link>
          <Link href="/suggest-a-job">Share a paid role</Link>
          <Link href="/contributions">My contributions</Link>
        </nav>
        <nav aria-labelledby="footer-learn">
          <h2 id="footer-learn">Learn</h2>
          <Link href="/paye-guide">PAYE guide</Link>
          <Link href="/tax-updates">Calculation rules</Link>
          <Link href="/about">About SalarySabi</Link>
          <Link href="/contact">Contact us</Link>
        </nav>
      </div>
      <p className="footer-legal-line">
        <span>© 2026 SalarySabi.</span>
        <span>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/disclaimer">Disclaimer</Link>
          <Link href="/security">Security</Link>
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
      <CampaignAnnouncement />
      <main className="public-page-main" id="main-content" tabIndex={-1}>{children}</main>
      <InfoFooter />
    </div>
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
  eyebrow?: string;
  title: string;
  intro?: string;
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
          {intro && <p>{intro}</p>}
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
