import { describe, expect, it } from "vitest";
import { jobPayContext } from "./job-pay-context";
import type { Job } from "./jobs";
const job = { title: "Engineer", slug: "engineer", salary_min: 2400000, salary_max: 3600000, salary_period: "annual", salary_type: "gross", salary_currency: "NGN", engagement_type: "employee" } as Job;
describe("job pay context", () => {
  it("converts annual ranges into monthly gross without applying deductions", () => {
    expect(jobPayContext(job)).toEqual({ title: "Engineer", slug: "engineer", minimum: 200000, maximum: 300000 });
  });
  it("requires a supported salary basis", () => {
    for (const change of [{ salary_currency: "USD" }, { salary_type: "net" }, { engagement_type: "contractor" }, { engagement_type: undefined }, { salary_min: -1 }, { salary_max: 1 }]) expect(jobPayContext({ ...job, ...change } as Job)).toBeUndefined();
    expect(jobPayContext(null)).toBeUndefined();
  });
});
