"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationLink = { href: string; label: string };
type AudienceKey = "talent" | "employer" | "community" | "learn";

const globalLinks: NavigationLink[] = [
  { href: "/#calculator", label: "Take-home calculator" },
  { href: "/payslip-checker", label: "Check payslip" },
  { href: "/offer-checker", label: "Check offer" },
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
      { href: "/#calculator", label: "Take-home calculator" },
      { href: "/payslip-checker", label: "Check payslip" },
      { href: "/offer-checker", label: "Check offer" },
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
    label: "Contribute",
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
  if (href === "/#calculator") return pathname === "/" || pathname.startsWith("/salary-after-tax/");
  if (href === "/paye-guide") return currentAudience(pathname) === "learn" && pathname !== "/" && pathname !== "/offer-checker" && !pathname.startsWith("/salary-after-tax/");
  return matchesPath(pathname, href);
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

  if (pathname === "/" || pathname === "/offer-checker" || pathname === "/payslip-checker" || pathname.startsWith("/salary-after-tax/")) return null;

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

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <Link aria-current={pathname === "/" ? "page" : undefined} href="/#calculator">Calculator</Link>
      <Link aria-current={pathname === "/payslip-checker" ? "page" : undefined} href="/payslip-checker">Payslip</Link>
      <Link aria-current={pathname === "/offer-checker" ? "page" : undefined} href="/offer-checker">Offer</Link>
      <details>
        <summary>More</summary>
        <div>
          <Link aria-current={audience === "community" ? "page" : undefined} href="/contributors">Contribute</Link>
          <Link aria-current={globalIsCurrent(pathname, "/paye-guide") ? "page" : undefined} href="/paye-guide">Learn</Link>
          <Link href="/tax-updates">Inspect the rules</Link>
          <Link href="/employers">For employers</Link>
        </div>
      </details>
    </nav>
  );
}
