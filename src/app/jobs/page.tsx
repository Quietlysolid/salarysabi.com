import type { Metadata } from "next";
import Link from "next/link";
import { JobBoard } from "@/components/job-board";
import { JobAlertForm } from "@/components/job-alert-form";
import { InfoFooter, InfoHeader } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Jobs in Nigeria With Salary Information | SalarySabi",
  description: "Find Nigerian jobs that show the salary before you apply.",
  alternates: { canonical: "/jobs" },
};

export default function JobsPage() {
  return (
    <main>
      <InfoHeader />
      <section className="jobs-hero">
        <span className="eyebrow">Jobs that show the salary</span>
        <h1>See the pay before you apply.</h1>
        <p>Every job here shows what it pays and links to the original application page.</p>
      </section>
      <section className="jobs-board" aria-label="Nigerian job listings"><JobBoard /></section>
      <section className="jobs-next-actions" aria-label="More job options">
        <details className="jobs-alert-disclosure">
          <summary><span>Get new jobs by email</span><small>Choose the jobs you want to hear about</small></summary>
          <JobAlertForm />
        </details>
        <div className="jobs-help-links">
          <p>Seen a job that shows the salary?</p>
          <Link href="/suggest-a-job">Send us the job</Link>
          <Link href="/post-a-job">Post a job</Link>
        </div>
      </section>
      <InfoFooter />
    </main>
  );
}
