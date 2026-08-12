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
  const initialJobs = (await getPublishedJobs()) ?? [];

  return (
    <PublicPageShell>
      <section className="jobs-hero">
        <span className="eyebrow">Verified job listings</span>
        <h1>Jobs where the salary is not a secret.</h1>
        <p>Every role shows pay before you apply and is checked against the employer&apos;s official source.</p>
        <div className="jobs-market-status"><strong>{initialJobs.length} transparent {initialJobs.length === 1 ? "role" : "roles"} live now</strong><span>SalarySabi is deliberately starting with a small, reviewed marketplace rather than filling the page with unverified listings.</span></div>
      </section>
      <section className="jobs-employer-callout" aria-label="Post a transparent job"><div><span className="eyebrow">Hiring?</span><h2>Put the salary where candidates can see it.</h2><p>Publish a reviewed role with clear pay, location, deadline and a direct application route.</p></div><Link href="/post-a-job">Post a salary-transparent job →</Link></section>
      <section className="jobs-board" aria-label="Nigerian job listings"><JobBoard initialJobs={initialJobs} /></section>
      <section className="jobs-next-actions" aria-label="More job options">
        <Link href="/suggest-a-job"><span><small>For job seekers</small><strong>Share an existing job</strong><em>Send an official listing for review</em></span><b aria-hidden="true">→</b></Link>
        <Link href="/post-a-job"><span><small>For employers and recruiters</small><strong>Post your own job</strong><em>Create a salary-transparent listing</em></span><b aria-hidden="true">→</b></Link>
      </section>
    </PublicPageShell>
  );
}
