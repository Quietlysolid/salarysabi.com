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
    expect(calculateCompanyTax(160_000_000, 100_000_000, 10_000_000).total).toBe(51_000_000);
  });
  it("includes both size limits and taxes amounts above either limit", () => {
    expect(calculateCompanyTax(100_000_000, 250_000_000, 0).total).toBe(0);
    expect(calculateCompanyTax(100_000_000.01, 250_000_000, 0).isSmallCompany).toBe(false);
    const result = calculateCompanyTax(12_000_000, 250_000_000.01, 2_000_000);
    expect(result.companyIncomeTax).toBe(3_000_000);
    expect(result.developmentLevy).toBe(400_000);
  });
  it("does not create negative tax for zero revenue or a loss", () => {
    expect(calculateCompanyTax(0, 0, 0).total).toBe(0);
    expect(calculateCompanyTax(120_000_000, 0, 130_000_000).total).toBe(0);
  });
  it("shows configurable investment withholding", () => {
    expect(calculateInvestmentWithholding(1_000_000, 10).withholding).toBe(100_000);
  });
});

it("does not give business profit the employment minimum-wage exemption", () => {
  expect(calculateIndependentIncome(820_000, 0).annualTax).toBe(3_000);
  expect(calculateIndependentIncome(840_000, 0).annualTax).toBe(6_000);
  expect(calculateForeignIncome(820, 1000, 0).annualTax).toBe(3_000);
});
it("uses distinct company tax bases", () => {
  const result = calculateCompanyTax(120_000_000, 0, 100_000_000, {assessableProfits:20_000_000,totalProfits:15_000_000});
  expect(result.companyIncomeTax).toBe(4_500_000);
  expect(result.developmentLevy).toBe(800_000);
  expect(result.usesEstimatedBases).toBe(false);
});
