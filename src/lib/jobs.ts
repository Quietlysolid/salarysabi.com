import { calculatePaye } from "./paye";

export type WorkMode = "onsite" | "hybrid" | "remote";
export type SalaryType = "gross" | "net";

export type Job = {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  location: string;
  work_mode: WorkMode;
  employment_type: string;
  description: string;
  salary_min: number;
  salary_max: number;
  salary_period: "monthly" | "annual";
  salary_type: SalaryType;
  application_url: string;
  source_url: string | null;
  employer_verified: boolean;
  source_verified_at: string;
  published_at: string;
  expires_at: string;
  status?: "draft" | "published" | "expired" | "filled" | "rejected";
  filled_at?: string | null;
  updated_at?: string;
};

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function formatJobSalary(job: Job) {
  const period = job.salary_period === "monthly" ? "month" : "year";
  return `${naira.format(job.salary_min)}–${naira.format(job.salary_max)} ${job.salary_type} / ${period}`;
}

export function monthlyGrossRange(job: Job) {
  if (job.salary_type !== "gross") return null;
  const divisor = job.salary_period === "annual" ? 12 : 1;
  return {
    minimum: job.salary_min / divisor,
    maximum: job.salary_max / divisor,
  };
}

export function estimatedMonthlyAfterPaye(monthlyGross: number) {
  return calculatePaye({ annualGrossIncome: monthlyGross * 12 })
    .monthlyIncomeAfterTax;
}

export function jobMatches(
  job: Job,
  query: string,
  workMode: "all" | WorkMode,
) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${job.title} ${job.company_name} ${job.location} ${job.description}`.toLowerCase();
  return (
    (workMode === "all" || job.work_mode === workMode) &&
    words.every((word) => haystack.includes(word))
  );
}
