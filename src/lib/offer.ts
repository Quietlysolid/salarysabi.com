import { ANNUAL_NATIONAL_MINIMUM_WAGE, calculatePaye } from "./paye";

export const MAX_MONTHLY_SALARY = 1_000_000_000;
export const salaryExamples = [100_000, 200_000, 300_000, 500_000, 750_000, 1_000_000, 2_000_000] as const;
export const formatNaira = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export type OfferAssumptions = {
  /** Employee contribution as a share of gross, derived from the pensionable pay entered. */
  pensionRate: number;
  annualRent: number;
  monthlyNhf: number;
  monthlyNhis: number;
  monthlyOther: number;
};

export const defaultOfferAssumptions: OfferAssumptions = {
  pensionRate: 0.08, annualRent: 0, monthlyNhf: 0, monthlyNhis: 0, monthlyOther: 0,
};

export function calculateOffer(monthlyGross: number, assumptions: OfferAssumptions) {
  if (!Number.isFinite(monthlyGross) || monthlyGross < 0 || monthlyGross > MAX_MONTHLY_SALARY
    || Object.values(assumptions).some(value => !Number.isFinite(value) || value < 0)
    || assumptions.pensionRate > 0.08) throw new RangeError("Invalid offer assumptions");
  const monthlyPension = monthlyGross * assumptions.pensionRate;
  const tax = calculatePaye({
    annualGrossIncome: monthlyGross * 12,
    pensionContribution: monthlyPension * 12,
    annualRentPaid: assumptions.annualRent,
    nhfContribution: assumptions.monthlyNhf * 12,
    nhisContribution: assumptions.monthlyNhis * 12,
  });
  const monthlyDeductions = monthlyPension + assumptions.monthlyNhf + assumptions.monthlyNhis + assumptions.monthlyOther;
  const monthlyTakeHome = monthlyGross - monthlyDeductions - tax.monthlyTax;
  return { tax, monthlyGross, monthlyPension, monthlyDeductions, monthlyTakeHome,
    annualTakeHome: monthlyTakeHome * 12,
    dailyTakeHome: monthlyTakeHome * 12 / 365,
    monthlyAfterRent: monthlyTakeHome - assumptions.annualRent / 12,
  };
}

/** Find the lowest whole-naira gross that meets the target, including the minimum-wage exemption. */
export function grossForTakeHome(target: number, assumptions: OfferAssumptions): number | null {
  if (!Number.isFinite(target) || target < 0 || target > MAX_MONTHLY_SALARY) return null;
  const exemptCeiling = ANNUAL_NATIONAL_MINIMUM_WAGE / 12;
  const fixedDeductions = assumptions.monthlyNhf + assumptions.monthlyNhis + assumptions.monthlyOther;
  // PAYE can jump immediately above minimum wage, so search the exempt interval separately.
  const exemptGross = Math.ceil((target + fixedDeductions) / (1 - assumptions.pensionRate));
  if (exemptGross <= exemptCeiling && calculateOffer(exemptGross, assumptions).monthlyTakeHome >= target) return exemptGross;
  let low = exemptCeiling + 1;
  let high = MAX_MONTHLY_SALARY;
  if (calculateOffer(high, assumptions).monthlyTakeHome < target) return null;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (calculateOffer(middle, assumptions).monthlyTakeHome >= target) high = middle;
    else low = middle + 1;
  }
  return low;
}
