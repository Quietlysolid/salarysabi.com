import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLinkIcon } from "@/components/external-link-icon";
import { InfoPage } from "@/components/info-page";
import { founderGitHubUrl, founderLinkedInUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About SalarySabi | Our Purpose and Team",
  description: "SalarySabi connects jobs with published pay, community salary knowledge, take-home estimates and payroll tools for people and businesses in Nigeria.",
  alternates: { canonical: "/about" },
};

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
  {
    role: "Operations & Data",
    name: "Udy Nwosu",
    links: [["LinkedIn", "https://ng.linkedin.com/in/udodirimnwosu"]],
  },
] as const;

export default function AboutPage() {
  return (
    <InfoPage eyebrow="About SalarySabi" title="Better pay decisions. Every step of the way.">
      <div className="about-simple about-story">
        <p className="about-introduction">From a job offer to a payslip to running payroll, it&apos;s all one pay story. SalarySabi connects the tools and salary knowledge to help individuals and employers in Nigeria make better decisions.</p>
        <div className="about-audiences">
        <section aria-labelledby="about-individuals-title">
          <h2 id="about-individuals-title">For individuals</h2>
          <p>Find roles with published salaries. Compare community pay reports, estimate your take-home and check the PAYE on your payslip.</p>
          <Link href="/individuals">Explore tools for individuals</Link>
        </section>
        <section aria-labelledby="about-employers-title">
          <h2 id="about-employers-title">For employers</h2>
          <p>Post roles with clear pay, track your listings, prepare your team&apos;s payroll and estimate company tax.</p>
          <Link href="/employers">Explore employer tools</Link>
        </section>
        </div>
        <aside className="about-evidence" aria-label="About our information">
          <p>Calculations are estimates, community figures are self-reported, and job listings undergo review before publication.</p>
          <Link href="/how-paye-is-calculated">How our calculations work</Link>
        </aside>

        <section className="about-team" aria-labelledby="about-team-title">
          <h2 className="about-team-heading" id="about-team-title">Meet the team.</h2>
          <div className="about-team-list">
            {team.map((member) => (
              <article className="about-team-member" key={member.name}>
                <span>{member.role}</span>
                <h3>{member.name}</h3>
                {member.links.length > 0 && <p className="about-profile-links">
                  {member.links.map(([label, href]) => (
                    <a href={href} key={label} rel="noreferrer" target="_blank">
                      {label} <ExternalLinkIcon />
                    </a>
                  ))}
                </p>}
              </article>
            ))}
          </div>
        </section>
        <p className="about-contact"><Link href="/contact">Contact us</Link></p>
      </div>
    </InfoPage>
  );
}
