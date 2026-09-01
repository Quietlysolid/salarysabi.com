import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ExternalLinkIcon } from "@/components/external-link-icon";
import { InfoPage } from "@/components/info-page";
import { founderGitHubUrl, founderLinkedInUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About SalarySabi | Pay Should Be Clear",
  description: "SalarySabi helps Nigerians understand their pay and helps employers calculate, explain and document what they pay.",
  alternates: { canonical: "/about" },
};

const audiences = [
  {
    eyebrow: "For people",
    title: "Know what reaches your bank.",
    description: "Calculate your take-home pay, check your PAYE, compare salaries and find jobs that publish the pay.",
    href: "/talent",
    action: "Explore talent tools",
  },
  {
    eyebrow: "For employers",
    title: "Pay people right. Prove it.",
    description: "Run payroll, calculate PAYE, keep reliable records and hire with published pay.",
    href: "/employers",
    action: "Explore employer tools",
  },
] as const;

const checks = [
  ["Official rules", "PAYE calculations use Nigerian legislation and published guidance."],
  ["Anonymous groups", "Public salary ranges appear only after five similar reports are approved."],
  ["Original sources", "Job pay and application links are checked against named sources."],
] as const;

const team = [
  {
    role: "Product & Engineering",
    name: "Ozichi Nwosu",
    links: [
      ["LinkedIn", founderLinkedInUrl],
      ["GitHub", founderGitHubUrl],
    ],
  },
  {
    role: "People & Talent",
    name: "Victoria Green",
    links: [["LinkedIn", "https://www.linkedin.com/in/victoria-green1/"]],
  },
  {
    role: "Content & Marketing",
    name: "Veno Green",
    links: [["LinkedIn", "https://www.linkedin.com/in/veno-green-583766183/"]],
  },
] as const;

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About SalarySabi"
      title="Pay should be clear."
      intro="SalarySabi helps people understand what they earn, while helping employers calculate, explain and document what they pay."
      heroAction={(
        <div className="about-hero-actions">
          <Link className="about-hero-action" href="/talent">
            Understand my pay <ArrowRight aria-hidden="true" />
          </Link>
          <Link className="about-hero-action" href="/employers">
            Manage my team&apos;s pay <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      )}
    >
      <div className="about-simple">
        <section className="about-outcomes" aria-labelledby="about-outcomes-title">
          <div className="about-section-heading">
            <span className="eyebrow">One platform</span>
            <h2 id="about-outcomes-title">Both sides of pay.</h2>
          </div>
          <div className="about-audience-list">
            {audiences.map((audience) => (
              <article className="about-audience-panel" key={audience.eyebrow}>
                <span className="eyebrow">{audience.eyebrow}</span>
                <h3>{audience.title}</h3>
                <p>{audience.description}</p>
                <Link href={audience.href}>
                  {audience.action} <ArrowRight aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="about-trust" id="checks" aria-labelledby="about-checks-title">
          <span className="eyebrow">Built to be checked</span>
          <h2 id="about-checks-title">Our numbers have receipts.</h2>
          <div className="about-checks">
            {checks.map(([title, description], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <Link className="about-trust-link" href="/tax-updates">
            Inspect the rules <ArrowRight aria-hidden="true" />
          </Link>
        </section>

        <section className="about-team" aria-labelledby="about-team-title">
          <h2 className="about-team-heading" id="about-team-title">Meet the team.</h2>
          <div className="about-team-list">
            {team.map((member) => (
              <article className="about-team-member" key={member.name}>
                <span>{member.role}</span>
                <h3>{member.name}</h3>
                <p className="about-profile-links">
                  {member.links.map(([label, href]) => (
                    <a href={href} key={label} rel="noreferrer" target="_blank">
                      {label} <ExternalLinkIcon />
                    </a>
                  ))}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </InfoPage>
  );
}
