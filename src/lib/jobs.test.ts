import { describe, expect, it } from "vitest";
import {
  calculateTransparencyScore,
  estimatedMonthlyAfterPaye,
  formatJobDate,
  formatJobSalary,
  jobDeadlineLabel,
  jobMatches,
  monthlyGrossRange,
  type Job,
} from "./jobs";

const job: Job = {
  id: "1",
  slug: "frontend-developer-example-limited-12345678",
  title: "Frontend Developer",
  company_name: "Example Limited",
  location: "Lagos",
  work_mode: "hybrid",
  employment_type: "Full time",
  description: "Build accessible React products.",
  salary_min: 400_000,
  salary_max: 600_000,
  salary_period: "monthly",
  salary_type: "gross",
  application_url: "https://example.com/apply",
  source_url: null,
  employer_verified: false,
  source_verified_at: "2026-08-01",
  published_at: "2026-08-01",
  expires_at: "2026-09-01",
};

describe("job helpers", () => {
  it("shows the salary basis and period", () => {
    expect(formatJobSalary(job)).toContain("gross per month");
  });

  it("does not invent a range or salary basis when the employer states neither", () => {
    expect(formatJobSalary({ ...job, salary_min: 25_357, salary_max: 25_357, salary_period: "annual", salary_currency: "USD", salary_type: "not_stated" }))
      .toBe("$25,357 per year");
  });

  it("does not shift a date-only deadline into the previous day", () => {
    expect(formatJobDate("2026-08-05")).toBe("5 Aug 2026");
  });

  it("does not present an internal review date as an employer deadline", () => {
    expect(jobDeadlineLabel({ expires_at: "2026-08-24", deadline_status: "unknown" }))
      .toBe("No deadline provided");
  });

  it("scores transparent evidence and applies risk penalties", () => {
    expect(calculateTransparencyScore({ salaryDisclosed: true, deadlineKnown: false, employerNamed: true, workArrangementClear: true, roleSpecific: true, companyApplication: false, recentlyChecked: true, contradictoryOrTemplated: true, identityUnverifiable: false })).toBe(50);
  });

  it("normalizes annual gross salary to a monthly range", () => {
    expect(
      monthlyGrossRange({ ...job, salary_period: "annual", salary_min: 4_800_000, salary_max: 7_200_000 }),
    ).toEqual({ minimum: 400_000, maximum: 600_000 });
  });

  it("does not present net salary as gross salary", () => {
    expect(monthlyGrossRange({ ...job, salary_type: "net" })).toBeNull();
  });

  it("searches title, company, location and description", () => {
    expect(jobMatches(job, "react lagos", "all")).toBe(true);
    expect(jobMatches(job, "react", "remote")).toBe(false);
  });

  it("uses the PAYE engine for gross-salary previews", () => {
    expect(estimatedMonthlyAfterPaye(200_000)).toBe(180_000);
  });
});
