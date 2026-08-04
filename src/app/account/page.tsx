import type { Metadata } from "next";
import { InfoHeader } from "@/components/info-page";
import { JobSeekerAccount } from "@/components/job-seeker-account";

export const metadata: Metadata = { title: "My Job Search | SalarySabi", robots: { index: false, follow: false } };
export default function AccountPage() { return <main><InfoHeader /><JobSeekerAccount /></main>; }
