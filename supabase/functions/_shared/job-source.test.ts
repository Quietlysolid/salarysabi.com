import { describe, expect, it } from "vitest";
import { canonicalizeJobUrl, isNigeriaRelevant, jobDedupeKey, salaryFromText } from "./job-source.ts";

describe("job source normalization", () => {
  it("normalizes equivalent job identities", () => {
    expect(jobDedupeKey("Senior Engineer", "Acme Ltd.", "Lagos, Nigeria")).toBe(jobDedupeKey(" senior-engineer ", "ACME LTD", "Lagos Nigeria"));
  });
  it("removes tracking parameters from canonical URLs", () => {
    expect(canonicalizeJobUrl("https://example.com/job/1?utm_source=x&ref=board")).toBe("https://example.com/job/1");
  });
  it("recognizes Nigerian and globally remote roles", () => {
    expect(isNigeriaRelevant("Lagos")).toBe(true);
    expect(isNigeriaRelevant("Remote, Nigeria")).toBe(true);
    expect(isNigeriaRelevant("Remote", "This role is remote across Africa.")).toBe(true);
    expect(isNigeriaRelevant("London", "UK only")).toBe(false);
  });
  it("does not treat company boilerplate as a Nigerian job location", () => {
    expect(isNigeriaRelevant("Remote, Poland", "Trusted by businesses across Nigeria.")).toBe(false);
    expect(isNigeriaRelevant("Cape Town, South Africa", "We process billions of Naira in Nigeria.")).toBe(false);
  });
  it("extracts an NGN salary from description text", () => {
    expect(salaryFromText("Compensation: NGN 500,000 - 700,000 monthly")).toEqual({ minimum: 500000, maximum: 700000, period: "monthly" });
    expect(salaryFromText("Salary: \u20a6400,000\u2013\u20a6900,000 per month")).toEqual({ minimum: 400000, maximum: 900000, period: "monthly" });
  });
  it("does not turn unrelated Naira figures into salaries", () => {
    expect(salaryFromText("Trusted by 10 million accounts, processing billions of Naira in transactions monthly.")).toBeNull();
    expect(salaryFromText("Underwrite large-ticket loans up to 5Bn NGN.")).toBeNull();
  });
});
