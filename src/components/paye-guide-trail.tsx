import Link from "next/link";

const guides = [
  { key: "methodology", href: "/how-paye-is-calculated", label: "Calculation method" },
  { key: "deductions", href: "/eligible-deductions", label: "Eligible deductions" },
  { key: "bands", href: "/tax-bands", label: "Tax bands" },
  { key: "gross-net", href: "/net-salary-vs-gross-salary-nigeria", label: "Gross vs take-home" },
] as const;

export function PayeGuideTrail({
  current,
  compactOnMobile = false,
}: {
  current?: (typeof guides)[number]["key"];
  compactOnMobile?: boolean;
}) {
  return (
    <nav className={`paye-guide-trail${compactOnMobile ? " paye-guide-trail--mobile-compact" : ""}`} aria-label="PAYE guide sections">
      <Link className="paye-guide-trail-home" href="/paye-guide">PAYE guide</Link>
      <div className="paye-guide-trail-links">
        {guides.map((guide, index) => (
          <Link aria-current={current === guide.key ? "page" : undefined} href={guide.href} key={guide.key}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            {guide.label}
          </Link>
        ))}
      </div>
      {compactOnMobile && (
        <details className="paye-guide-trail-mobile">
          <summary>More PAYE guides</summary>
          <div>
            {guides.filter((guide) => guide.key !== current).map((guide) => (
              <Link href={guide.href} key={guide.key}>{guide.label}</Link>
            ))}
          </div>
        </details>
      )}
    </nav>
  );
}
