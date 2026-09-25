import { calculatePaye } from "./paye";

const clean = (value: number) => Number.isFinite(value) && value > 0 ? value : 0;

export function calculateIndependentIncome(revenue: number, expenses: number, deductions = 0) {
  const gross = clean(revenue);
  const allowableExpenses = Math.min(gross, clean(expenses));
  const netBusinessIncome = Math.max(0, gross - allowableExpenses);
  const paye = calculatePaye({ annualGrossIncome: netBusinessIncome, incomeType: "business", otherEligibleDeductions: clean(deductions) });
  return { gross, allowableExpenses, netBusinessIncome, annualTax: paye.annualTax, monthlyReserve: paye.annualTax / 12, afterTax: netBusinessIncome - paye.annualTax, bands: paye.bands };
}

export function calculateForeignIncome(amount: number, nairaPerUnit: number, expenses: number, deductions = 0) {
  const nairaRevenue = clean(amount) * clean(nairaPerUnit);
  return { nairaRevenue, ...calculateIndependentIncome(nairaRevenue, expenses, deductions) };
}

export function calculateCompanyTax(turnover: number, fixedAssets: number, expenses: number, bases?: { assessableProfits: number; totalProfits: number }) {
  const revenue = clean(turnover);
  const profit = Math.max(0, revenue - Math.min(revenue, clean(expenses)));
  // National Assembly January 2026 text, section 201 (definition); sections 56 and 59 (rates).
  // This is a size-only planning model, not a complete eligibility assessment.
  const isSmallCompany = revenue <= 100_000_000 && clean(fixedAssets) <= 250_000_000;
  const assessableProfits = bases ? clean(bases.assessableProfits) : profit;
  const totalProfits = bases ? clean(bases.totalProfits) : profit;
  const companyIncomeTax = isSmallCompany ? 0 : totalProfits * 0.3;
  const developmentLevy = isSmallCompany ? 0 : assessableProfits * 0.04;
  return { revenue, profit, assessableProfits, totalProfits, usesEstimatedBases: !bases, isSmallCompany, companyIncomeTax, developmentLevy, total: companyIncomeTax + developmentLevy, afterTax: profit - companyIncomeTax - developmentLevy };
}

export function calculateInvestmentWithholding(income: number, ratePercent = 10) {
  const gross = clean(income);
  const rate = Math.min(100, clean(ratePercent)) / 100;
  const withholding = gross * rate;
  return { gross, rate, withholding, net: gross - withholding };
}
