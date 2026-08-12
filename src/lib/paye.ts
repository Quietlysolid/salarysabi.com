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

export type LegacyPayeResult = {
  annualTax: number;
  monthlyTax: number;
  differenceFrom2026: number;
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

// Planning comparison using the Personal Income Tax Act rules that applied
// before 1 January 2026: CRA, the former graduated bands and minimum tax.
export function calculateLegacyPaye(inputs: PayeInputs): LegacyPayeResult {
  const gross = asMoney(inputs.annualGrossIncome);
  if (!gross) return { annualTax: 0, monthlyTax: 0, differenceFrom2026: 0 };
  const pension = asMoney(inputs.pensionContribution);
  const nhf = asMoney(inputs.nhfContribution);
  const nhis = asMoney(inputs.nhisContribution);
  const life = asMoney(inputs.lifeInsurancePremium);
  const cra = Math.max(200_000, gross * 0.01) + gross * 0.2;
  let remaining = Math.max(0, gross - pension - nhf - nhis - life - cra);
  const formerBands = [
    [300_000, 0.07], [300_000, 0.11], [500_000, 0.15],
    [500_000, 0.19], [1_600_000, 0.21], [Number.POSITIVE_INFINITY, 0.24],
  ] as const;
  const graduated = formerBands.reduce((tax, [width, rate]) => {
    const amount = Math.min(remaining, width);
    remaining = Math.max(0, remaining - amount);
    return tax + amount * rate;
  }, 0);
  const annualTax = Math.max(graduated, gross * 0.01);
  const current = calculatePaye(inputs).annualTax;
  return { annualTax, monthlyTax: annualTax / 12, differenceFrom2026: annualTax - current };
}
