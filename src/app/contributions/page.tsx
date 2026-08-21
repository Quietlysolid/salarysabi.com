import type { Metadata } from "next";
import { ContributorDashboard } from "@/components/contributor-dashboard";
import { PublicPageShell } from "@/components/info-page";

export const metadata: Metadata = {
  title: "My Contributions and Rewards | SalarySabi",
  description: "Track SalarySabi contribution reviews, approved rewards and payout requests.",
  alternates: { canonical: "/contributions" },
  robots: { index: false, follow: false },
};

export default async function ContributionsPage({ searchParams }: { searchParams: Promise<{ fixture?: string }> }) {
  const query = await searchParams;
  return <PublicPageShell><ContributorDashboard fixtureMode={process.env.NODE_ENV !== "production" && query.fixture === "1"} /></PublicPageShell>;
}
