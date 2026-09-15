import { describe, expect, it } from "vitest";
import { calculateOffer, defaultOfferAssumptions, grossForTakeHome, MAX_MONTHLY_SALARY, salaryExamples } from "./offer";

describe("offer decisions", () => {
  it("calculates the brief's offer, keeping rent separate from payroll deductions", () => {
    const result = calculateOffer(650_000, { ...defaultOfferAssumptions, annualRent: 1_800_000 });
    expect(result.monthlyPension).toBe(52_000);
    expect(result.tax.chargeableIncome).toBe(6_816_000);
    expect(result.tax.monthlyTax).toBe(84_740);
    expect(result.monthlyTakeHome).toBe(513_260);
    expect(result.annualTakeHome).toBe(6_159_120);
    expect(result.monthlyAfterRent).toBe(363_260);
    expect(result.dailyTakeHome).toBeCloseTo(6_159_120 / 365);
  });
  it("gives other payroll deductions no tax relief", () => {
    const baseline = calculateOffer(500_000, defaultOfferAssumptions);
    const other = calculateOffer(500_000, { ...defaultOfferAssumptions, monthlyOther: 20_000 });
    const nhf = calculateOffer(500_000, { ...defaultOfferAssumptions, monthlyNhf: 20_000 });
    expect(other.tax.annualTax).toBe(baseline.tax.annualTax);
    expect(other.monthlyTakeHome).toBe(baseline.monthlyTakeHome - 20_000);
    expect(nhf.monthlyTakeHome).toBeGreaterThan(other.monthlyTakeHome);
  });
  it("caps relief while budgeting for the full rent", () => {
    const result = calculateOffer(500_000, { ...defaultOfferAssumptions, annualRent: 6_000_000 });
    expect(result.tax.rentRelief).toBe(500_000);
    expect(result.monthlyAfterRent).toBe(result.monthlyTakeHome - 500_000);
  });
  it("finds the minimum whole-naira gross for a target across tax bands", () => {
    for (const pensionRate of [0, 0.04, 0.08]) {
      const assumptions = { ...defaultOfferAssumptions, pensionRate, annualRent: 1_800_000, monthlyOther: 10_000, monthlyNhf: 5_000 };
      for (const target of [...salaryExamples, 5_000_000, 20_000_000]) {
        const gross = grossForTakeHome(target, assumptions)!;
        expect(calculateOffer(gross, assumptions).monthlyTakeHome).toBeGreaterThanOrEqual(target);
        expect(calculateOffer(gross - 1, assumptions).monthlyTakeHome).toBeLessThan(target);
      }
    }
  });
  it("finds exempt solutions even when PAYE jumps above minimum wage", () => {
    const assumptions = { ...defaultOfferAssumptions, pensionRate: 0 };
    expect(grossForTakeHome(69_900, assumptions)).toBe(69_900);
    expect(grossForTakeHome(70_000, assumptions)).toBe(70_000);
    const gross = grossForTakeHome(70_001, assumptions)!;
    expect(gross).toBeGreaterThan(70_001);
    expect(calculateOffer(gross, assumptions).monthlyTakeHome).toBeGreaterThanOrEqual(70_001);
    expect(calculateOffer(gross - 1, assumptions).monthlyTakeHome).toBeLessThan(70_001);
  });
  it("supports no income and zero targets without hiding a deduction deficit", () => {
    expect(grossForTakeHome(0, defaultOfferAssumptions)).toBe(0);
    expect(calculateOffer(0, { ...defaultOfferAssumptions, monthlyOther: 100 }).monthlyTakeHome).toBe(-100);
  });
  it("rejects invalid amounts and targets outside the supported range", () => {
    for (const amount of [-1, NaN, Infinity, MAX_MONTHLY_SALARY + 1]) {
      expect(() => calculateOffer(amount, defaultOfferAssumptions)).toThrow(RangeError);
      expect(grossForTakeHome(amount, defaultOfferAssumptions)).toBeNull();
    }
    expect(grossForTakeHome(MAX_MONTHLY_SALARY, defaultOfferAssumptions)).toBeNull();
  });
});
