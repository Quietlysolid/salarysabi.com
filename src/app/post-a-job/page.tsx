import type { Metadata } from "next";
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
        <h1>Post a job</h1>
        <p>Post a role with a published salary range. We review every submission.</p>
      </section>
      <section className="job-wizard-shell">
        <JobSubmissionForm />
      </section>
    </PublicPageShell>
  );
}
