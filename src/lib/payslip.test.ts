import { describe, expect, it } from "vitest";
import { checkPayslip } from "./payslip";

describe("checkPayslip", () => {
  it("compares payslip PAYE with the existing PAYE engine", () => {
    const result = checkPayslip({ monthlyGross: 500_000, monthlyPaye: 72_500 });
    expect(result.expectedMonthlyPaye).toBe(72_500);
    expect(result.comparison).toBe("close");
    expect(result.verdict).toBe("looks_consistent");
    expect(result.estimatedTakeHome).toBe(427_500);
    expect(result.expectedTakeHome).toBe(427_500);
    expect(result.takeHomeDifference).toBe(0);
  });

  it("includes entered deductions in take-home pay", () => {
    const result = checkPayslip({
      monthlyGross: 500_000,
      monthlyPaye: 65_000,
      monthlyPension: 40_000,
      otherDeductions: 5_000,
    });
    expect(result.totalDeductions).toBe(110_000);
    expect(result.estimatedTakeHome).toBe(390_000);
    expect(result.expectedTakeHome).toBe(389_700);
  });

  it("applies annual rent relief without treating rent as a payslip deduction", () => {
    const result = checkPayslip({
      monthlyGross: 500_000,
      monthlyPaye: 68_900,
      annualRentPaid: 1_200_000,
    });
    expect(result.annualRentRelief).toBe(240_000);
    expect(result.expectedMonthlyPaye).toBe(68_900);
    expect(result.totalDeductions).toBe(68_900);
    expect(result.verdict).toBe("looks_consistent");
  });

  it("recommends review for a meaningful but modest PAYE difference", () => {
    const result = checkPayslip({ monthlyGross: 500_000, monthlyPaye: 70_000 });
    expect(result.comparison).toBe("lower");
    expect(result.verdict).toBe("review_recommended");
    expect(result.takeHomeDifference).toBe(2_500);
  });

  it("flags a large PAYE difference as a likely discrepancy", () => {
    const result = checkPayslip({ monthlyGross: 500_000, monthlyPaye: 45_000 });
    expect(result.comparison).toBe("lower");
    expect(result.verdict).toBe("likely_discrepancy");
    expect(result.takeHomeDifference).toBe(27_500);
  });
});
