import type { Metadata } from "next";
import { PublicPageShell } from "@/components/info-page";
import { ContributorProgram } from "@/components/contributor-program";

export const metadata: Metadata = { title: "Earn ₦1,000 for a Salary Report | SalarySabi", description: "Share a two-minute anonymous salary report and earn ₦1,000 after approval.", alternates: { canonical: "/contributors" } };
export default function ContributorsPage() { return <PublicPageShell><ContributorProgram /></PublicPageShell>; }
