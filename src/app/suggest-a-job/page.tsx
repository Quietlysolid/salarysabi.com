import type { Metadata } from "next";
import Link from "next/link";
import { JobSuggestionForm } from "@/components/job-suggestion-form";
import { PublicPageShell } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Share an Existing Job | SalarySabi",
  description: "Share an official job listing that includes the salary for SalarySabi to review.",
  alternates: { canonical: "/suggest-a-job" },
};

export default function SuggestAJobPage() {
  return (
    <PublicPageShell>
      <section className="form-page-hero form-page-hero-short">
        <span className="eyebrow">For job seekers and supporters</span>
        <h1>Share an existing job</h1>
        <p>Seen an official listing that shows the salary? Send its link and SalarySabi will verify it before publishing.</p>
        <aside className="submission-path-note"><strong>Are you the employer?</strong><span>Create your own listing through the <Link href="/post-a-job">employer posting form</Link>.</span></aside>
      </section>
      <section className="standalone-job-form standalone-job-form-short">
        <JobSuggestionForm />
      </section>
    </PublicPageShell>
  );
}
