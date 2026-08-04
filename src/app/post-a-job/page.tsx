import type { Metadata } from "next";
import { JobSubmissionForm } from "@/components/job-submission-form";
import { InfoFooter, InfoHeader } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Post a Job | SalarySabi",
  description: "Post a Nigerian job that includes the salary.",
  alternates: { canonical: "/post-a-job" },
};

export default function PostAJobPage() {
  return (
    <main>
      <InfoHeader />
      <section className="form-page-hero">
        <span className="eyebrow">For employers and recruiters</span>
        <h1>Post a job</h1>
        <p>It is free during the beta. The salary and a working application link are required.</p>
      </section>
      <section className="standalone-job-form">
        <div className="form-page-note">
          <strong>Before you start</strong>
          <p>Have the salary, closing date and application link ready. We check every job before it goes live.</p>
        </div>
        <JobSubmissionForm />
      </section>
      <InfoFooter />
    </main>
  );
}
