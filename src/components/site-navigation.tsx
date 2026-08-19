"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/#calculator", label: "Take-home pay", className: "nav-primary" },
  { href: "/payslip-checker", label: "Check payslip PAYE" },
  { href: "/salaries-and-jobs", label: "Salaries & jobs" },
  { href: "/business", label: "For businesses" },
  { href: "/contributors", label: "Earn rewards", className: "nav-cta" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/#calculator") return pathname === "/";
  if (href === "/salaries-and-jobs") return ["/salaries-and-jobs", "/salaries", "/jobs", "/account", "/suggest-a-job"].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (href === "/business") return ["/business", "/payroll", "/company-tax", "/post-a-job"].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (href === "/paye-guide") {
    return ["/paye-guide", "/how-paye-is-calculated", "/eligible-deductions", "/tax-bands", "/net-salary-vs-gross-salary-nigeria", "/tax-updates", "/tax-news"].some(
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
          className={`${link.className || ""}${link.href === "/contributors" && !isCurrent(pathname, link.href) ? " nav-cta--quiet" : ""}`.trim()}
          href={link.href}
          key={link.href}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
