"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationLink = { href: string; label: string };
type AudienceKey = "talent" | "employer";
const globalLinks: NavigationLink[] = [
  { href: "/individuals", label: "For individuals" },
  { href: "/employers", label: "For employers" },
];
const routeGroups: Record<AudienceKey, string[]> = {
  talent: ["/individuals", "/salaries", "/calculator", "/salaries-and-jobs", "/jobs", "/account"],
  employer: ["/employers", "/hiring", "/business", "/payroll", "/company-tax", "/post-a-job"],
};
const audienceNavigation: Record<AudienceKey, { label: string; home: string; links: NavigationLink[] }> = {
  talent: { label: "For individuals", home: "/individuals", links: [
    { href: "/calculator", label: "Calculate my pay" },
    { href: "/jobs", label: "Find jobs with pay" },
    { href: "/salaries", label: "Salary community" },
  ] },
  employer: { label: "For employers", home: "/employers", links: [
    { href: "/payroll", label: "Run payroll" },
    { href: "/company-tax", label: "Company tax" },
    { href: "/post-a-job", label: "Post a job" },
    { href: "/hiring", label: "Manage my listings" },
  ] },
};
function matchesPath(pathname: string, href: string) {
  const base = href.split("#")[0];
  return pathname === base || (base !== "/" && pathname.startsWith(`${base}/`));
}
function currentAudience(pathname: string): AudienceKey | null {
  for (const key of ["employer", "talent"] as AudienceKey[]) {
    if (routeGroups[key].some((route) => matchesPath(pathname, route))) return key;
  }
  return null;
}
function globalIsCurrent(pathname: string, href: string) {
  if (pathname === "/") return false;
  const audience = currentAudience(pathname);
  if (href === "/individuals") return audience === "talent";
  if (href === "/employers") return audience === "employer";
  return false;
}
export function SiteNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Primary navigation" className="primary-navigation">
    {globalLinks.map((link) => <Link aria-current={globalIsCurrent(pathname, link.href) ? "page" : undefined} href={link.href} key={link.href}>{link.label}</Link>)}
  </nav>;
}
export function AudienceNavigation() {
  const pathname = usePathname();
  const audience = currentAudience(pathname);
  if (!audience) return null;
  const navigation = audienceNavigation[audience];
  return <div className={`audience-navigation audience-navigation--${audience}`} data-audience={audience}>
    <div className="audience-navigation-inner">
      <Link className="audience-navigation-home" href={navigation.home}>{navigation.label}</Link>
      <nav aria-label={`${navigation.label} tools`}>
        {navigation.links.map((link) => <Link aria-current={matchesPath(pathname, link.href) ? "page" : undefined} href={link.href} key={link.href}>{link.label}</Link>)}
      </nav>
    </div>
  </div>;
}
export function MobileNavigation() {
  const pathname = usePathname();
  const audience = currentAudience(pathname);
  const section = audience ? audienceNavigation[audience] : null;
  return <nav className="mobile-nav" aria-label="Mobile navigation">
    <Link aria-current={audience === "talent" ? "page" : undefined} href="/individuals">For individuals</Link>
    <Link aria-current={audience === "employer" ? "page" : undefined} href="/employers">For employers</Link>
    <details>
      <summary>More</summary>
      <div>
        <Link href="/tax-updates">Inspect the rules</Link>
        {section && <span className="mobile-nav-section-label">{section.label}</span>}
        {section?.links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
      </div>
    </details>
  </nav>;
}
