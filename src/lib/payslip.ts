import { calculatePaye } from "./paye";

export type PayslipInputs = {
  monthlyGross: number;
  monthlyPaye: number;
  monthlyPension?: number;
  monthlyNhf?: number;
  monthlyNhis?: number;
  otherDeductions?: number;
};

const safeMoney = (value: number | undefined) =>
  Number.isFinite(value) && (value ?? 0) > 0 ? value ?? 0 : 0;

export function checkPayslip(inputs: PayslipInputs) {
  const monthlyGross = safeMoney(inputs.monthlyGross);
  const monthlyPaye = safeMoney(inputs.monthlyPaye);
  const monthlyPension = safeMoney(inputs.monthlyPension);
  const monthlyNhf = safeMoney(inputs.monthlyNhf);
  const monthlyNhis = safeMoney(inputs.monthlyNhis);
  const otherDeductions = safeMoney(inputs.otherDeductions);
  const estimate = calculatePaye({
    annualGrossIncome: monthlyGross * 12,
    pensionContribution: monthlyPension * 12,
    nhfContribution: monthlyNhf * 12,
    nhisContribution: monthlyNhis * 12,
  });
  const difference = monthlyPaye - estimate.monthlyTax;
  const tolerance = Math.max(100, estimate.monthlyTax * 0.01);
  const comparison =
    Math.abs(difference) <= tolerance
      ? "close"
      : difference > 0
        ? "higher"
        : "lower";
  const totalDeductions =
    monthlyPaye + monthlyPension + monthlyNhf + monthlyNhis + otherDeductions;

  return {
    expectedMonthlyPaye: estimate.monthlyTax,
    difference,
    comparison,
    totalDeductions,
    estimatedTakeHome: Math.max(0, monthlyGross - totalDeductions),
  };
}
