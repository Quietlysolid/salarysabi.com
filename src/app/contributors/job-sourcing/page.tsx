import type { Metadata } from "next";
import { JobScoutProgram } from "@/components/job-scout-program";
import { PublicPageShell } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Find Salary-Transparent Jobs | SalarySabi",
  description: "Submit official Nigerian vacancies with published salaries for independent review and a campaign reward when the paid pilot is active.",
  alternates: { canonical: "/contributors/job-sourcing" },
};

export default function JobSourcingPage() {
  return (
    <PublicPageShell>
      <JobScoutProgram />
    </PublicPageShell>
  );
}
