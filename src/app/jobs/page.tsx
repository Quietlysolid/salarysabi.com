import type { Metadata } from "next";
import Link from "next/link";
import { JobBoard } from "@/components/job-board";
import { JourneyNextSteps } from "@/components/journey-next-steps";
import { PublicPageShell } from "@/components/info-page";
import { getPublishedJobs } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Jobs in Nigeria With Salary Information | SalarySabi",
  description: "Find Nigerian jobs that show the salary, listing source and current verification status.",
  alternates: { canonical: "/jobs" },
};

export default async function JobsPage() {
  const initialJobs = (await getPublishedJobs()) ?? [];

  return (
    <PublicPageShell>
      <section className="jobs-hero">
        <h1>Jobs with salaries</h1>
        <p>See the salary and source before applying.</p>
        <div className="jobs-market-status"><strong>{initialJobs.length} {initialJobs.length === 1 ? "job" : "jobs"} available</strong></div>
      </section>
      <section className="jobs-board" aria-label="Nigerian job listings"><JobBoard initialJobs={initialJobs} /></section>
      <section className="jobs-next-actions" aria-label="More job options">
        <Link href="/suggest-a-job"><span><strong>Found a genuine published-pay job?</strong><small>Send the original source for SalarySabi to review.</small></span><b aria-hidden="true">→</b></Link>
        <Link href="/post-a-job"><span><strong>Are you hiring?</strong><small>Post a role that shows candidates the salary.</small></span><b aria-hidden="true">→</b></Link>
      </section>
      <JourneyNextSteps
        title="Use the salary before you apply"
        steps={[
          { href: "/#calculator", title: "Estimate take-home pay", description: "See what an advertised gross salary may leave after PAYE." },
          { href: "/salaries", title: "Compare the salary", description: "Check reviewed ranges as public groups become available." },
          { href: "/account", title: "Track applications", description: "Save jobs and keep your progress together." },
        ]}
      />
    </PublicPageShell>
  );
}
