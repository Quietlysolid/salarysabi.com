import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { founderGitHubUrl, founderLinkedInUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About SalarySabi | Nigerian PAYE Calculator",
  description: "Learn what SalarySabi does, who built it and how its PAYE calculations are checked.",
  alternates: { canonical: "/about" },
};

const tools = [
  ["Calculate take-home pay", "/#calculator"],
  ["Check payslip PAYE", "/payslip-checker"],
  ["Compare salaries", "/salaries"],
  ["Find jobs with salaries", "/jobs"],
] as const;

const checks = [
  ["Official sources", "Rules come from Nigerian legislation and official guidance."],
  ["Automated tests", "Tests cover tax bands, deductions, reliefs and rounding."],
  ["Published updates", "Important calculation changes are recorded publicly."],
] as const;

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About SalarySabi"
      title="Pay and tax, explained clearly."
      intro="Know what you earn, what you owe and what you keep."
    >
      <div className="about-simple">
        <section className="about-simple-section" aria-labelledby="about-tools-title">
          <h2 id="about-tools-title">What SalarySabi helps you do</h2>
          <div className="about-tool-links">
            {tools.map(([label, href]) => (
              <Link href={href} key={href}><span>{label}</span><span aria-hidden="true">→</span></Link>
            ))}
          </div>
        </section>

        <section className="about-simple-section about-founder" aria-labelledby="about-founder-title">
          <div>
            <h2 id="about-founder-title">Built by Ozichi Nwosu</h2>
          </div>
          <div>
            <p>A Nigerian software engineer who independently designs, develops and maintains SalarySabi.</p>
            <p className="about-profile-links">
              <a href={founderLinkedInUrl} rel="me noreferrer" target="_blank">LinkedIn ↗</a>
              <a href={founderGitHubUrl} rel="me noreferrer" target="_blank">GitHub ↗</a>
            </p>
          </div>
        </section>

        <section className="about-simple-section" aria-labelledby="about-checks-title">
          <h2 id="about-checks-title">How we check the numbers</h2>
          <div className="about-checks">
            {checks.map(([title, description]) => (
              <article key={title}><h3>{title}</h3><p>{description}</p></article>
            ))}
          </div>
          <div className="about-method-links">
            <Link href="/paye-guide">See how PAYE works</Link>
            <Link href="/tax-updates">View update history</Link>
          </div>
        </section>

        <p className="about-boundary">SalarySabi is independent and does not replace professional tax advice.</p>
      </div>
    </InfoPage>
  );
}
