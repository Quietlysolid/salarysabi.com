import { getPublishedJobBySlug } from "@/lib/supabase";
import { type Job } from "@/lib/jobs";
import { jobPayContext } from "@/lib/job-pay-context";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/info-page";
import { PayslipChecker } from "@/components/payslip-checker";
export const metadata: Metadata = {
  title: "Take-home Pay Calculator & Payslip Check | SalarySabi",
  description: "Estimate Nigerian take-home pay or compare the PAYE on your payslip.",
  alternates: { canonical: "/calculator" },
};
export default async function CalculatorPage({ searchParams }: { searchParams: Promise<{ mode?: string; from?: string; job?: string; bound?: string }> }) {
  const params = await searchParams;
  const mode = params.mode === "check" || params.from === "calculator" ? "check" : "calculate";
  const job = params.job ? await getPublishedJobBySlug(params.job).catch(() => null) as Job | null : null;
  const offer = jobPayContext(job);
  return <PublicPageShell><PayslipChecker key={`${mode}:${offer?.slug ?? "manual"}`} initialMode={mode} offer={offer} unavailableOffer={Boolean(params.job && !offer)} /></PublicPageShell>;
}
