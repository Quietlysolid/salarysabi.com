import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
        <aside className="submission-path-note submission-path-note-modern">
          <div>
            <strong>Are you the employer?</strong>
            <span>Publish and manage your own vacancy.</span>
          </div>
          <Link href="/post-a-job">
            Open employer form
            <ArrowRight aria-hidden="true" size={18} strokeWidth={2.25} />
          </Link>
        </aside>
      </section>
      <section className="standalone-job-form standalone-job-form-short">
        <JobSuggestionForm />
      </section>
    </PublicPageShell>
  );
}
