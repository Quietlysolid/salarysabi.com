import type { Metadata } from "next";
import { JobBoard } from "@/components/job-board";
import { JobSubmissionForm } from "@/components/job-submission-form";
import { JobAlertForm } from "@/components/job-alert-form";
import { JobSuggestionForm } from "@/components/job-suggestion-form";
import { InfoFooter, InfoHeader } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Jobs in Nigeria With Salary Information | SalarySabi",
  description: "Search verified Nigerian jobs that disclose salary, distinguish gross from net pay and show an estimated PAYE preview.",
  alternates: { canonical: "/jobs" },
};

export default function JobsPage() {
  return (
    <main>
      <InfoHeader />
      <section className="jobs-hero">
        <span className="eyebrow">Salary-transparent jobs</span>
        <h1>Know the pay before you apply.</h1>
        <p>Every published role must disclose a salary range, say whether it is gross or net, and provide a working application link.</p>
      </section>
      <section className="jobs-alert-wrap"><JobAlertForm /></section>
      <section className="jobs-board" aria-label="Nigerian job listings"><JobBoard /></section>
      <section className="job-submit" id="post-a-job">
        <div className="job-submit-copy"><span className="eyebrow">For employers</span><h2>Post a salary-transparent job</h2><p>Submission is free during the beta. Every job is reviewed before it appears publicly.</p></div>
        <JobSubmissionForm />
      </section>
      <section className="job-submit" id="suggest-a-job">
        <div className="job-submit-copy"><span className="eyebrow">Help us find good jobs</span><h2>Found a job with the salary shown?</h2><p>Send the official employer link. We verify it before it appears on SalarySabi.</p></div>
        <JobSuggestionForm />
      </section>
      <InfoFooter />
    </main>
  );
}
