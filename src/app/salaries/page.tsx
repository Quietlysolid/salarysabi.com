import { PublicPageShell } from "@/components/info-page";
import { SalaryCommunity, type SalaryRange } from "@/components/salary-community";

export const metadata = {
  title: "Salary Community | SalarySabi",
  description: "Compare grouped Nigerian salary ranges and privately share your pay to help others understand theirs.",
  alternates: { canonical: "/salaries" },
};

async function getSalaryRanges(): Promise<SalaryRange[] | null> {
  const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!endpoint || !key) return null;
  try {
    const response = await fetch(`${endpoint}/rest/v1/rpc/public_recent_salary_benchmarks`, {
      method: "POST", headers: { apikey: key, "Content-Type": "application/json" },
      body: "{}", cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const rows = await response.json();
    return Array.isArray(rows) ? rows.filter((row: SalaryRange) => Number(row.sample_size) >= 5) : null;
  } catch { return null; }
}

export default async function SalariesPage() {
  const initialRanges = await getSalaryRanges();
  return <PublicPageShell><SalaryCommunity initialRanges={initialRanges} /></PublicPageShell>;
}
