import type { Metadata } from "next";
import Link from "next/link";
import { JobBoard } from "@/components/job-board";
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
        <Link href="/suggest-a-job"><span><strong>Suggest a job</strong></span><b aria-hidden="true">→</b></Link>
        <Link href="/post-a-job"><span><strong>Post a job</strong></span><b aria-hidden="true">→</b></Link>
      </section>
    </PublicPageShell>
  );
}
