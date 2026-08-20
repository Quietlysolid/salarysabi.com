import type { Metadata } from "next";
import Link from "next/link";
import { EarlyAccessForm } from "@/components/early-access-form";
import { PublicPageShell } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Job Sourcing Programme | SalarySabi",
  description: "Learn about SalarySabi's proposed reward programme for verified salary-transparent job sources.",
  alternates: { canonical: "/contributors/job-sourcing" },
};

export default function JobSourcingPage() {
  return (
    <PublicPageShell>
      <div className="contributor-page job-sourcing-page">
        <header className="contributor-hero">
          <span className="eyebrow">Job sourcing · separate programme</span>
          <h1>Find salary-transparent jobs. Help candidates see pay before they apply.</h1>
          <p>This programme needs source verification, employer attribution and hiring milestones. Its reward and launch date are still being defined; it is separate from the active ₦1,000 salary-report pilot.</p>
          <Link href="/contributors">Go to the active salary-report offer →</Link>
        </header>
        <section className="contributor-reward-model">
          <header><span className="eyebrow">Proposed structure</span><h2>A longer, three-stage verification flow.</h2></header>
          <ol>
            <li><strong>01</strong><div><span>Job verified and published</span><small>The vacancy must be open, original, salary-transparent and on an official employer source.</small></div></li>
            <li><strong>02</strong><div><span>Employer confirms a hire</span><small>The employer confirms a SalarySabi-attributed application resulted in employment.</small></div></li>
            <li><strong>03</strong><div><span>Three-month milestone</span><small>The employer, not the contributor, confirms retention.</small></div></li>
          </ol>
          <p className="contributor-pilot-status"><strong>Reward TBD.</strong> Job-source submissions remain unpaid until final attribution, budget and payout terms are published.</p>
        </section>
        <aside className="contributor-account job-source-interest">
          <span className="eyebrow">Job-sourcing updates</span>
          <h2>Hear when this separate programme opens.</h2>
          <p>Join for one email when the final job-sourcing reward and rules are ready.</p>
          <EarlyAccessForm source="contributor_program" idPrefix="job-sourcing" label="Email address" placeholder="you@example.com" buttonText="Notify me" successMessage="You’re on the job-sourcing update list." consentText="I agree to receive one job-sourcing programme update." />
        </aside>
      </div>
    </PublicPageShell>
  );
}
