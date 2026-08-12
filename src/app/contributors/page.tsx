import type { Metadata } from "next";
import { PublicPageShell } from "@/components/info-page";
import { ContributorProgram } from "@/components/contributor-program";

export const metadata: Metadata = { title: "SalarySabi Contributor Pilot", description: "Register interest in proposed, independently reviewed rewards for credible Nigerian salary information and transparent job sources." };
export default function ContributorsPage() { return <PublicPageShell><ContributorProgram /></PublicPageShell>; }
