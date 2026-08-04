import type { Metadata } from "next";
import { JobSuggestionForm } from "@/components/job-suggestion-form";
import { InfoFooter, InfoHeader } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Send Us a Job | SalarySabi",
  description: "Send SalarySabi an official job link that includes the salary.",
  alternates: { canonical: "/suggest-a-job" },
};

export default function SuggestAJobPage() {
  return (
    <main>
      <InfoHeader />
      <section className="form-page-hero">
        <span className="eyebrow">Help other job seekers</span>
        <h1>Send us a job</h1>
        <p>Seen a job that shows the salary? Send the company’s official link and we will check it.</p>
      </section>
      <section className="standalone-job-form standalone-job-form-short">
        <JobSuggestionForm />
      </section>
      <InfoFooter />
    </main>
  );
}
