export type PayeInputs = {
  annualGrossIncome: number;
  pensionContribution?: number;
  nhfContribution?: number;
  nhisContribution?: number;
  mortgageInterest?: number;
  lifeInsurancePremium?: number;
  annualRentPaid?: number;
};

export type TaxBandResult = {
  label: string;
  rate: number;
  taxableAmount: number;
  tax: number;
};

export type PayeResult = {
  annualGrossIncome: number;
  rentRelief: number;
  totalEligibleDeductions: number;
  chargeableIncome: number;
  annualTax: number;
  monthlyTax: number;
  effectiveTaxRate: number;
  annualIncomeAfterTax: number;
  monthlyIncomeAfterTax: number;
  bands: TaxBandResult[];
};

const TAX_BANDS = [
  { label: "First ₦800,000", width: 800_000, rate: 0 },
  { label: "Next ₦2,200,000", width: 2_200_000, rate: 0.15 },
  { label: "Next ₦9,000,000", width: 9_000_000, rate: 0.18 },
  { label: "Next ₦13,000,000", width: 13_000_000, rate: 0.21 },
  { label: "Next ₦25,000,000", width: 25_000_000, rate: 0.23 },
  { label: "Above ₦50,000,000", width: Number.POSITIVE_INFINITY, rate: 0.25 },
] as const;

// National Minimum Wage (Amendment) Act 2024: ₦70,000 per month.
// Nigeria Tax Act 2025, s. 163(1)(t), exempts employment income where gross
// income is no more than the national minimum wage.
export const ANNUAL_NATIONAL_MINIMUM_WAGE = 70_000 * 12;

const asMoney = (value: number | undefined) =>
  Number.isFinite(value) && (value ?? 0) > 0 ? value ?? 0 : 0;

export function calculatePaye(inputs: PayeInputs): PayeResult {
  const annualGrossIncome = asMoney(inputs.annualGrossIncome);
  const rentRelief = Math.min(asMoney(inputs.annualRentPaid) * 0.2, 500_000);
  const totalEligibleDeductions =
    asMoney(inputs.pensionContribution) +
    asMoney(inputs.nhfContribution) +
    asMoney(inputs.nhisContribution) +
    asMoney(inputs.mortgageInterest) +
    asMoney(inputs.lifeInsurancePremium) +
    rentRelief;
  const chargeableIncome = Math.max(
    0,
    annualGrossIncome - totalEligibleDeductions,
  );

  let remaining = chargeableIncome;
  const bands = TAX_BANDS.map((band) => {
    const taxableAmount = Math.min(remaining, band.width);
    const tax = taxableAmount * band.rate;
    remaining = Math.max(0, remaining - taxableAmount);
    return { ...band, taxableAmount, tax };
  });
  const annualTax =
    annualGrossIncome <= ANNUAL_NATIONAL_MINIMUM_WAGE
      ? 0
      : bands.reduce((total, band) => total + band.tax, 0);

  return {
    annualGrossIncome,
    rentRelief,
    totalEligibleDeductions,
    chargeableIncome,
    annualTax,
    monthlyTax: annualTax / 12,
    effectiveTaxRate:
      annualGrossIncome === 0 ? 0 : annualTax / annualGrossIncome,
    annualIncomeAfterTax: annualGrossIncome - annualTax,
    monthlyIncomeAfterTax: (annualGrossIncome - annualTax) / 12,
    bands,
  };
}
