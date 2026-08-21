"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/#calculator", label: "Pay & tax" },
  { href: "/salaries-and-jobs", label: "Jobs & salaries" },
  { href: "/business", label: "For employers" },
  { href: "/paye-guide", label: "Learn" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/#calculator") return ["/", "/payslip-checker", "/tax-tools"].some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
  if (href === "/salaries-and-jobs") return ["/salaries-and-jobs", "/salaries", "/jobs", "/contributors", "/contributions", "/suggest-a-job"].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (href === "/business") return ["/business", "/payroll", "/company-tax", "/post-a-job"].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (href === "/paye-guide") {
    return ["/paye-guide", "/how-paye-is-calculated", "/eligible-deductions", "/tax-bands", "/net-salary-vs-gross-salary-nigeria", "/tax-updates", "/tax-news", "/calculation-notes", "/about"].some(
      (guidePath) => pathname === guidePath || pathname.startsWith(`${guidePath}/`),
    );
  }
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function SiteNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation">
      {links.map((link) => (
        <Link
          aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
          className=""
          href={link.href}
          key={link.href}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <Link aria-current={isCurrent(pathname, "/#calculator") ? "page" : undefined} href="/#calculator">Pay &amp; tax</Link>
      <Link aria-current={isCurrent(pathname, "/salaries-and-jobs") ? "page" : undefined} href="/salaries-and-jobs">Jobs &amp; salaries</Link>
      <details className={isCurrent(pathname, "/business") || isCurrent(pathname, "/paye-guide") ? "has-current-page" : undefined}>
        <summary>More</summary>
        <div>
          <Link aria-current={isCurrent(pathname, "/business") ? "page" : undefined} href="/business">For employers</Link>
          <Link aria-current={isCurrent(pathname, "/paye-guide") ? "page" : undefined} href="/paye-guide">Learn</Link>
          <Link href="/contributors">Contribute pay data</Link>
          <Link href="/contributions">My contributions</Link>
          <Link href="/contact">Contact us</Link>
        </div>
      </details>
    </nav>
  );
}
