"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationLink = { href: string; label: string };
type AudienceKey = "talent" | "employer" | "community" | "learn";

const globalLinks: NavigationLink[] = [
  { href: "/talent", label: "For talent" },
  { href: "/employers", label: "For employers" },
  { href: "/contributors", label: "Contribute" },
  { href: "/paye-guide", label: "Learn" },
];

const routeGroups: Record<AudienceKey, string[]> = {
  talent: ["/talent", "/payslip-checker", "/salaries-and-jobs", "/salaries", "/jobs", "/account"],
  employer: ["/employers", "/business", "/payroll", "/company-tax", "/post-a-job"],
  community: ["/contributors", "/contributions", "/suggest-a-job"],
  learn: [
    "/paye-guide",
    "/how-paye-is-calculated",
    "/eligible-deductions",
    "/tax-bands",
    "/net-salary-vs-gross-salary-nigeria",
    "/tax-updates",
    "/tax-news",
    "/calculation-notes",
    "/tax-tools",
    "/freelancer-tax",
    "/creator-tax",
    "/foreign-income-tax",
    "/investment-tax",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/disclaimer",
    "/security",
    "/accessibility",
  ],
};

const audienceNavigation: Record<AudienceKey, { label: string; home: string; links: NavigationLink[] }> = {
  talent: {
    label: "For talent",
    home: "/talent",
    links: [
      { href: "/payslip-checker", label: "Pay & tax" },
      { href: "/salaries", label: "Salary ranges" },
      { href: "/jobs", label: "Jobs with salary" },
    ],
  },
  employer: {
    label: "For employers",
    home: "/employers",
    links: [
      { href: "/payroll", label: "Run payroll" },
      { href: "/company-tax", label: "Company tax" },
      { href: "/post-a-job", label: "Post a role" },
    ],
  },
  community: {
    label: "Community",
    home: "/contributors",
    links: [
      { href: "/contributors", label: "Contribute pay data" },
      { href: "/suggest-a-job", label: "Share a paid role" },
      { href: "/contributions", label: "My contributions" },
    ],
  },
  learn: {
    label: "SalarySabi knowledge",
    home: "/paye-guide",
    links: [
      { href: "/paye-guide", label: "PAYE guide" },
      { href: "/how-paye-is-calculated", label: "How PAYE works" },
      { href: "/tax-updates", label: "Rules & updates" },
    ],
  },
};

function matchesPath(pathname: string, href: string) {
  const base = href.split("#")[0];
  return pathname === base || (base !== "/" && pathname.startsWith(`${base}/`));
}

function currentAudience(pathname: string): AudienceKey {
  for (const key of ["employer", "community", "talent", "learn"] as AudienceKey[]) {
    if (routeGroups[key].some((route) => matchesPath(pathname, route))) return key;
  }
  return "learn";
}

function globalIsCurrent(pathname: string, href: string) {
  const audience = currentAudience(pathname);
  if (href === "/talent") return audience === "talent";
  if (href === "/employers") return audience === "employer";
  if (href === "/contributors") return audience === "community";
  return audience === "learn";
}

export function SiteNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="primary-navigation">
      {globalLinks.map((link) => (
        <Link
          aria-current={globalIsCurrent(pathname, link.href) ? "page" : undefined}
          href={link.href}
          key={link.href}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function AudienceNavigation() {
  const pathname = usePathname();
  const audience = currentAudience(pathname);
  const navigation = audienceNavigation[audience];

  return (
    <div className={`audience-navigation audience-navigation--${audience}`} data-audience={audience}>
      <div className="audience-navigation-inner">
        <Link className="audience-navigation-home" href={navigation.home}>{navigation.label}</Link>
        <nav aria-label={`${navigation.label} tools`}>
          {navigation.links.map((link) => (
            <Link
              aria-current={matchesPath(pathname, link.href) ? "page" : undefined}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  const audience = currentAudience(pathname);
  const section = audienceNavigation[audience];

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <Link aria-current={audience === "talent" ? "page" : undefined} href="/talent">Talent</Link>
      <Link aria-current={audience === "employer" ? "page" : undefined} href="/employers">Employers</Link>
      <details className={audience === "community" || audience === "learn" ? "has-current-page" : undefined}>
        <summary>More</summary>
        <div>
          <Link aria-current={audience === "community" ? "page" : undefined} href="/contributors">Contribute</Link>
          <Link aria-current={audience === "learn" ? "page" : undefined} href="/paye-guide">Learn</Link>
          <Link href="/tax-updates">Inspect the rules</Link>
          <span className="mobile-nav-section-label">{section.label}</span>
          {section.links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
        </div>
      </details>
    </nav>
  );
}
