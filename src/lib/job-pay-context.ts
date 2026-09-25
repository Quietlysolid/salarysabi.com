import { monthlyGrossRange, type Job } from "./jobs";

export function jobPayContext(job: Job | null) {
  if (!job || job.salary_currency !== "NGN" || job.engagement_type !== "employee" || job.salary_type !== "gross") return undefined;
  const range = monthlyGrossRange(job);
  if (!range || !Number.isFinite(range.minimum) || !Number.isFinite(range.maximum) || range.minimum <= 0 || range.maximum < range.minimum) return undefined;
  return { title: job.title, slug: job.slug, minimum: range.minimum, maximum: range.maximum };
}
