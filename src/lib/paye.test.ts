import { describe, expect, it } from "vitest";
import { calculatePaye } from "./paye";

describe("calculatePaye", () => {
  it("matches the official JRB ₦2.4m no-deduction example", () => {
    const result = calculatePaye({ annualGrossIncome: 2_400_000 });
    expect(result.chargeableIncome).toBe(2_400_000);
    expect(result.annualTax).toBe(240_000);
    expect(result.monthlyTax).toBe(20_000);
  });

  it("charges no tax when chargeable income is within the zero band", () => {
    const result = calculatePaye({ annualGrossIncome: 800_000 });
    expect(result.annualTax).toBe(0);
  });

  it("applies the 15% band after the first ₦800,000", () => {
    const result = calculatePaye({ annualGrossIncome: 3_000_000 });
    expect(result.annualTax).toBe(330_000);
    expect(result.monthlyTax).toBe(27_500);
  });

  it("applies eligible deductions and capped rent relief", () => {
    const result = calculatePaye({
      annualGrossIncome: 6_000_000,
      pensionContribution: 480_000,
      annualRentPaid: 1_200_000,
    });
    expect(result.rentRelief).toBe(240_000);
    expect(result.chargeableIncome).toBe(5_280_000);
    expect(result.annualTax).toBeCloseTo(740_400);
    expect(result.monthlyTax).toBeCloseTo(61_700);
  });

  it("caps rent relief at ₦500,000", () => {
    const result = calculatePaye({
      annualGrossIncome: 10_000_000,
      annualRentPaid: 4_000_000,
    });
    expect(result.rentRelief).toBe(500_000);
  });

  it("applies all six bands above ₦50 million", () => {
    const result = calculatePaye({ annualGrossIncome: 60_000_000 });
    expect(result.annualTax).toBe(12_930_000);
  });

  it.each([
    [800_000, 0],
    [3_000_000, 330_000],
    [12_000_000, 1_950_000],
    [25_000_000, 4_680_000],
    [50_000_000, 10_430_000],
    [60_000_000, 12_930_000],
  ])(
    "applies the official cumulative tax at the ₦%i boundary",
    (annualGrossIncome, expectedTax) => {
      expect(calculatePaye({ annualGrossIncome }).annualTax).toBe(expectedTax);
    },
  );

  it("deducts every eligible annual amount before applying tax bands", () => {
    const result = calculatePaye({
      annualGrossIncome: 6_000_000,
      pensionContribution: 480_000,
      nhfContribution: 120_000,
      nhisContribution: 60_000,
      mortgageInterest: 100_000,
      lifeInsurancePremium: 50_000,
      annualRentPaid: 1_200_000,
    });

    expect(result.rentRelief).toBe(240_000);
    expect(result.totalEligibleDeductions).toBe(1_050_000);
    expect(result.chargeableIncome).toBe(4_950_000);
    expect(result.annualTax).toBeCloseTo(681_000);
    expect(result.monthlyTax).toBeCloseTo(56_750);
  });

  it("uses actual rent attributable to the year before applying relief", () => {
    const result = calculatePaye({
      annualGrossIncome: 6_000_000,
      annualRentPaid: 1_000_000,
    });
    expect(result.rentRelief).toBe(200_000);
  });

  it("preserves fractional monthly tax instead of silently rounding", () => {
    const result = calculatePaye({ annualGrossIncome: 3_000_001 });
    expect(result.annualTax).toBeCloseTo(330_000.18);
    expect(result.monthlyTax).toBeCloseTo(27_500.015);
  });

  it("treats invalid and negative monetary inputs as zero", () => {
    const result = calculatePaye({
      annualGrossIncome: Number.NaN,
      pensionContribution: -100_000,
      annualRentPaid: -500_000,
    });
    expect(result.annualGrossIncome).toBe(0);
    expect(result.totalEligibleDeductions).toBe(0);
    expect(result.annualTax).toBe(0);
  });

  it("never returns negative taxable income for excessive deductions", () => {
    const result = calculatePaye({
      annualGrossIncome: 1_000_000,
      pensionContribution: 2_000_000,
    });
    expect(result.chargeableIncome).toBe(0);
    expect(result.annualTax).toBe(0);
  });
});
