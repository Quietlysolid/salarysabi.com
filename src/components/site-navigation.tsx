"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Calculate PAYE", className: "nav-primary" },
  { href: "/payslip-checker", label: "Check payslip" },
  { href: "/paye-guide", label: "PAYE guide" },
  { href: "/tax-updates", label: "Tax updates" },
  { href: "/payroll", label: "For employers" },
  { href: "/jobs", label: "Jobs with salaries" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/paye-guide") {
    return ["/paye-guide", "/how-paye-is-calculated", "/eligible-deductions", "/tax-bands"].some(
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
