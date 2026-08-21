import type { Metadata } from "next";
import { AdminContributorProgram } from "@/components/admin-contributor-program";

export const metadata: Metadata = {
  title: "Contributor Programme Administration | SalarySabi",
  robots: { index: false, follow: false },
};

export default async function AdminContributorsPage({ searchParams }: { searchParams: Promise<{ fixture?: string }> }) {
  const params = await searchParams;
  const fixtureMode = process.env.NODE_ENV !== "production" && params.fixture === "1";
  return <AdminContributorProgram fixtureMode={fixtureMode} />;
}
