import type { Metadata } from "next";
import Link from "next/link";
import { JobSubmissionForm } from "@/components/job-submission-form";
import { PublicPageShell } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Post a Salary-Transparent Job in Nigeria | SalarySabi",
  description: "Submit a Nigerian job with an advertised salary for SalarySabi to review and publish for job seekers.",
  alternates: { canonical: "/post-a-job" },
};

export default function PostAJobPage() {
  return (
    <PublicPageShell>
      <section className="job-wizard-hero">
        <span className="eyebrow">For employers and recruiters</span>
        <h1>Post your own salary-transparent job</h1>
        <p>Create a listing for a role your organisation or client is hiring for.</p>
        <aside className="submission-path-note"><strong>Not the employer or recruiter?</strong><span>If you found an existing public listing, <Link href="/suggest-a-job">share its official link instead</Link>.</span></aside>
      </section>
      <section className="job-wizard-shell">
        <JobSubmissionForm />
      </section>
    </PublicPageShell>
  );
}
