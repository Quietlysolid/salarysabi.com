import { describe, expect, it } from "vitest";
import { checkPayslip } from "./payslip";

describe("checkPayslip", () => {
  it("compares payslip PAYE with the existing PAYE engine", () => {
    const result = checkPayslip({ monthlyGross: 500_000, monthlyPaye: 72_500 });
    expect(result.expectedMonthlyPaye).toBe(72_500);
    expect(result.comparison).toBe("close");
    expect(result.estimatedTakeHome).toBe(427_500);
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
  });
});
