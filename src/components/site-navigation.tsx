"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/tax-tools", label: "Calculate", className: "nav-primary" },
  { href: "/salaries-and-jobs", label: "Salaries & jobs" },
  { href: "/business", label: "For businesses" },
  { href: "/paye-guide", label: "Learn" },
  { href: "/contributors", label: "Contribute" },
  { href: "/payslip-checker", label: "Check my payslip", className: "nav-cta" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/tax-tools") return ["/", "/tax-tools", "/freelancer-tax", "/creator-tax", "/foreign-income-tax", "/investment-tax"].some((path) => pathname === path);
  if (href === "/salaries-and-jobs") return ["/salaries-and-jobs", "/salaries", "/jobs", "/account", "/suggest-a-job"].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (href === "/business") return ["/business", "/payroll", "/company-tax", "/post-a-job"].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (href === "/paye-guide") {
    return ["/paye-guide", "/how-paye-is-calculated", "/eligible-deductions", "/tax-bands", "/tax-updates", "/tax-news"].some(
      (guidePath) => pathname === guidePath || pathname.startsWith(`${guidePath}/`),
    );
  }
  if (href === "/contributors") return pathname.startsWith("/contributors");
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function SiteNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation">
      {links.map((link) => (
        <Link
          aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
          className={link.className}
          href={link.href}
          key={link.href}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
