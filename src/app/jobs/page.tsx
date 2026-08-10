import type { Metadata } from "next";
import Link from "next/link";
import { JobBoard } from "@/components/job-board";
import { PublicPageShell } from "@/components/info-page";
import { getPublishedJobs } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Jobs in Nigeria With Salary Information | SalarySabi",
  description: "Find verified jobs in Nigeria with advertised salary ranges, source checks and direct links to the employer's application page.",
  alternates: { canonical: "/jobs" },
};

export default async function JobsPage() {
  const initialJobs = await getPublishedJobs();

  return (
    <PublicPageShell>
      <section className="jobs-hero">
        <span className="eyebrow">Verified job listings</span>
        <h1>Jobs where the salary is not a secret.</h1>
        <p>Each listing is checked against the employer&apos;s official source.</p>
      </section>
      <section className="jobs-board" aria-label="Nigerian job listings"><JobBoard initialJobs={initialJobs} /></section>
      <section className="jobs-next-actions" aria-label="More job options">
        <Link href="/suggest-a-job"><span><small>For job seekers</small><strong>Share an existing job</strong><em>Send an official listing for review</em></span><b aria-hidden="true">→</b></Link>
        <Link href="/post-a-job"><span><small>For employers and recruiters</small><strong>Post your own job</strong><em>Create a salary-transparent listing</em></span><b aria-hidden="true">→</b></Link>
      </section>
    </PublicPageShell>
  );
}
