import { calculatePaye } from "./paye";

export type WorkMode = "onsite" | "hybrid" | "remote";
export type SalaryType = "gross" | "net" | "not_stated";
export type SalaryCurrency = "NGN" | "USD" | "GBP" | "EUR";

export type Job = {
  id: string; slug: string; title: string; company_name: string; location: string;
  work_mode: WorkMode; employment_type: string; description: string;
  salary_min: number; salary_max: number; salary_period: "monthly" | "annual";
  salary_type: SalaryType; salary_currency: SalaryCurrency;
  salary_source: "employer_disclosed" | "source_reported" | "third_party_estimate";
  application_url: string; source_url: string | null; employer_verified: boolean;
  source_verified_at: string; published_at: string; expires_at: string;
  source_kind: "employer_submission" | "official_page" | "licensed_feed" | "community_tip";
  source_name: string | null; source_job_id: string | null; canonical_url: string | null;
  source_last_seen_at: string | null; global_remote: boolean;
  engagement_type: "employee" | "contractor" | "unknown";
  status?: "draft" | "published" | "expired" | "filled" | "rejected";
  filled_at?: string | null; updated_at?: string;
  deadline_status?: "employer_provided" | "verified" | "estimated" | "unknown" | "rolling";
  transparency_score?: number;
  transparency_notes?: string[];
  verification_status?: "verified" | "pending" | "unverified";
};

export function jobDeadlineLabel(job: Pick<Job, "deadline_status" | "expires_at">) {
  if (job.deadline_status === "unknown") return "No deadline provided";
  if (job.deadline_status === "rolling") return "Rolling applications";
  if (job.deadline_status === "estimated") return `Estimated close ${formatJobDate(job.expires_at)}`;
  return formatJobDate(job.expires_at);
}

export type TransparencySignals = {
  salaryDisclosed: boolean;
  deadlineKnown: boolean;
  employerNamed: boolean;
  workArrangementClear: boolean;
  roleSpecific: boolean;
  companyApplication: boolean;
  recentlyChecked: boolean;
  contradictoryOrTemplated: boolean;
  identityUnverifiable: boolean;
};

export function calculateTransparencyScore(signals: TransparencySignals) {
  const score =
    (signals.salaryDisclosed ? 20 : 0) +
    (signals.deadlineKnown ? 20 : 0) +
    (signals.employerNamed ? 15 : 0) +
    (signals.workArrangementClear ? 15 : 0) +
    (signals.roleSpecific ? 10 : 0) +
    (signals.companyApplication ? 10 : 0) +
    (signals.recentlyChecked ? 10 : 0) -
    (signals.contradictoryOrTemplated ? 20 : 0) -
    (signals.identityUnverifiable ? 30 : 0);
  return Math.max(0, Math.min(100, score));
}

export function formatJobSalary(job: Pick<Job, "salary_period" | "salary_currency" | "salary_min" | "salary_max" | "salary_type">) {
  const period = job.salary_period === "monthly" ? "month" : "year";
  const currency = job.salary_currency || "NGN";
  const formatter = new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 });
  const amount = job.salary_min === job.salary_max
    ? formatter.format(job.salary_min)
    : `${formatter.format(job.salary_min)}–${formatter.format(job.salary_max)}`;
  const basis = job.salary_type === "not_stated" ? "" : ` ${job.salary_type}`;
  return `${amount}${basis} per ${period}`;
}

export function formatJobDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function monthlyGrossRange(job: Job) {
  if (job.salary_type !== "gross" || (job.salary_currency && job.salary_currency !== "NGN") || (job.engagement_type && job.engagement_type !== "employee")) return null;
  const divisor = job.salary_period === "annual" ? 12 : 1;
  return { minimum: job.salary_min / divisor, maximum: job.salary_max / divisor };
}

export function estimatedMonthlyAfterPaye(monthlyGross: number) {
  return calculatePaye({ annualGrossIncome: monthlyGross * 12 }).monthlyIncomeAfterTax;
}

export function verificationLabel(job: Job) {
  if (job.verification_status === "pending") return "Verification pending";
  if (job.verification_status === "unverified") return "Not independently verified";
  if (job.source_kind === "employer_submission") return "Employer submitted";
  if (job.source_kind === "licensed_feed") return "Licensed feed";
  if (job.source_kind === "official_page") return "Official source checked";
  if (job.source_kind === "community_tip") return "Third-party listing checked";
  return "Application link checked";
}

export function salarySourceLabel(job: Job) {
  if (job.salary_source === "employer_disclosed" && job.salary_type === "not_stated")
    return "Salary shown in official listing";
  if (job.salary_source === "employer_disclosed") return "Salary disclosed by employer";
  if (job.salary_source === "third_party_estimate") return "Third-party salary estimate";
  return `Salary reported by ${job.source_name || "source"}`;
}

export function jobMatches(job: Job, query: string, workMode: "all" | WorkMode) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${job.title} ${job.company_name} ${job.location} ${job.description}`.toLowerCase();
  return (workMode === "all" || job.work_mode === workMode) && words.every((word) => haystack.includes(word));
}
