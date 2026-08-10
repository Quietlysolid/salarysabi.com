import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";

export const metadata: Metadata = {
  title: "Administration | SalarySabi",
  alternates: { canonical: "/admin" },
  robots: { index: false, follow: false },
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ fixture?: string }> }) {
  const params = await searchParams;
  const fixtureMode = process.env.NODE_ENV !== "production" && params.fixture === "1";
  return <main className="admin-page"><AdminDashboard fixtureMode={fixtureMode} /></main>;
}
