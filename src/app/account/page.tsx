import type { Metadata } from "next";
import { PublicPageShell } from "@/components/info-page";
import { JobSeekerAccount } from "@/components/job-seeker-account";

export const metadata: Metadata = {
  title: "Job Workspace | SalarySabi",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: false },
};
export default function AccountPage() {
  return (
    <PublicPageShell>
      <JobSeekerAccount />
    </PublicPageShell>
  );
}
