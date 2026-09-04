import { calculatePaye } from "./paye";

export type PayslipInputs = {
  monthlyGross: number;
  monthlyPaye: number;
  monthlyPension?: number;
  monthlyNhf?: number;
  monthlyNhis?: number;
  annualRentPaid?: number;
  otherDeductions?: number;
};

export type PayslipVerdict =
  | "looks_consistent"
  | "review_recommended"
  | "likely_discrepancy";

export type PayslipComparison = "close" | "higher" | "lower";

const safeMoney = (value: number | undefined) =>
  Number.isFinite(value) && (value ?? 0) > 0 ? value ?? 0 : 0;

export function checkPayslip(inputs: PayslipInputs) {
  const monthlyGross = safeMoney(inputs.monthlyGross);
  const monthlyPaye = safeMoney(inputs.monthlyPaye);
  const monthlyPension = safeMoney(inputs.monthlyPension);
  const monthlyNhf = safeMoney(inputs.monthlyNhf);
  const monthlyNhis = safeMoney(inputs.monthlyNhis);
  const annualRentPaid = safeMoney(inputs.annualRentPaid);
  const otherDeductions = safeMoney(inputs.otherDeductions);
  const estimate = calculatePaye({
    annualGrossIncome: monthlyGross * 12,
    pensionContribution: monthlyPension * 12,
    nhfContribution: monthlyNhf * 12,
    nhisContribution: monthlyNhis * 12,
    annualRentPaid,
  });
  const difference = monthlyPaye - estimate.monthlyTax;
  const tolerance = Math.max(100, estimate.monthlyTax * 0.01);
  const comparison: PayslipComparison =
    Math.abs(difference) <= tolerance
      ? "close"
      : difference > 0
        ? "higher"
        : "lower";
  const reviewTolerance = Math.max(5_000, estimate.monthlyTax * 0.1);
  const verdict: PayslipVerdict =
    comparison === "close"
      ? "looks_consistent"
      : Math.abs(difference) <= reviewTolerance
        ? "review_recommended"
        : "likely_discrepancy";
  const totalDeductions =
    monthlyPaye + monthlyPension + monthlyNhf + monthlyNhis + otherDeductions;
  const otherMonthlyDeductions =
    monthlyPension + monthlyNhf + monthlyNhis + otherDeductions;

  return {
    expectedMonthlyPaye: estimate.monthlyTax,
    annualRentRelief: estimate.rentRelief,
    difference,
    comparison,
    verdict,
    totalDeductions,
    estimatedTakeHome: Math.max(0, monthlyGross - totalDeductions),
    expectedTakeHome: Math.max(
      0,
      monthlyGross - estimate.monthlyTax - otherMonthlyDeductions,
    ),
    takeHomeDifference: difference === 0 ? 0 : -difference,
  };
}
