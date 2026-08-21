import type { Metadata } from "next";
import Link from "next/link";
import { JobSuggestionForm } from "@/components/job-suggestion-form";
import { PublicPageShell } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Submit a Salary-Transparent Job | SalarySabi",
  description: "Send an official, active Nigerian vacancy with an employer-published salary for independent SalarySabi review.",
  alternates: { canonical: "/suggest-a-job" },
};

export default function SuggestAJobPage() {
  return (
    <PublicPageShell>
      <section className="form-page-hero form-page-hero-short">
        <span className="eyebrow">Salary-transparent job source</span>
        <h1>Submit an official job with published pay</h1>
        <p>Send the original employer vacancy. SalarySabi will verify the application, Nigerian eligibility and advertised salary before accepting it.</p>
        <aside className="submission-path-note"><strong>Are you the employer?</strong><span>Create your own listing through the <Link href="/post-a-job">employer posting form</Link>.</span></aside>
      </section>
      <section className="standalone-job-form standalone-job-form-short">
        <JobSuggestionForm />
      </section>
    </PublicPageShell>
  );
}
