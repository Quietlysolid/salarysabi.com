"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/#calculator", label: "For me" },
  { href: "/business", label: "For my business" },
  { href: "/paye-guide", label: "Learn about PAYE" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/#calculator") return ["/", "/payslip-checker", "/salaries-and-jobs", "/salaries", "/jobs", "/account", "/suggest-a-job"].some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
  if (href === "/business") return ["/business", "/payroll", "/company-tax", "/post-a-job"].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (href === "/paye-guide") {
    return ["/paye-guide", "/how-paye-is-calculated", "/eligible-deductions", "/tax-bands", "/net-salary-vs-gross-salary-nigeria", "/tax-updates", "/tax-news"].some(
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
      <Link aria-current={isCurrent(pathname, "/#calculator") ? "page" : undefined} href="/#calculator">For me</Link>
      <Link aria-current={isCurrent(pathname, "/business") ? "page" : undefined} href="/business">For business</Link>
      <details>
        <summary>Menu</summary>
        <div>
          <Link aria-current={isCurrent(pathname, "/paye-guide") ? "page" : undefined} href="/paye-guide">Learn about PAYE</Link>
          <Link href="/payslip-checker">Check payslip PAYE</Link>
          <Link href="/salaries-and-jobs">Salaries &amp; jobs</Link>
          <Link href="/contact">Contact us</Link>
        </div>
      </details>
    </nav>
  );
}
