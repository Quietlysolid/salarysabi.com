import { describe, expect, it } from "vitest";
import { calculateCompanyTax, calculateForeignIncome, calculateIndependentIncome, calculateInvestmentWithholding } from "./tax-planners";

describe("tax planning calculators", () => {
  it("taxes independent work on profit rather than revenue", () => {
    const result = calculateIndependentIncome(12_000_000, 2_000_000);
    expect(result.netBusinessIncome).toBe(10_000_000);
    expect(result.annualTax).toBeGreaterThan(0);
  });
  it("converts foreign income before estimating personal tax", () => {
    expect(calculateForeignIncome(10_000, 1_500, 0).nairaRevenue).toBe(15_000_000);
  });
  it("applies the small-company thresholds", () => {
    expect(calculateCompanyTax(40_000_000, 100_000_000, 10_000_000).total).toBe(0);
    expect(calculateCompanyTax(60_000_000, 100_000_000, 10_000_000).total).toBe(17_000_000);
  });
  it("shows configurable investment withholding", () => {
    expect(calculateInvestmentWithholding(1_000_000, 10).withholding).toBe(100_000);
  });
});
