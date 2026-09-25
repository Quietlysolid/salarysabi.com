import { calculatePaye } from "./paye";
import { rulesetVersion } from "./site";

export type PayrollEmployeeInput = {
  id: string;
  employeeNumber: string;
  fullName: string;
  email?: string;
  annualMortgageInterestRelief?: number;
  precedingYearLifeInsuranceRelief?: number;
  monthlyGross: number;
  monthlyPension: number;
  monthlyNhf: number;
  monthlyNhis: number;
  monthlyMortgageInterest: number;
  monthlyLifeInsurance: number;
  monthlyRent: number;
  monthlyOtherDeductions: number;
};

export type PayrollLine = PayrollEmployeeInput & {
  monthlyPaye: number;
  monthlyStatutoryDeductions: number;
  monthlyNetPay: number;
  rulesetVersion: string;
};

export const payrollCsvHeaders = [
  "employee_number", "full_name", "email", "monthly_gross", "monthly_pension", "monthly_nhf", "monthly_nhis",
  "monthly_mortgage_interest", "monthly_life_insurance", "monthly_rent", "monthly_other_deductions",
  "annual_mortgage_interest_relief", "preceding_year_life_insurance_relief",
] as const;

export type PayrollImportRow = Omit<PayrollEmployeeInput, "id"> & { rowNumber: number };

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') { current += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { values.push(current.trim()); current = ""; }
    else current += character;
  }
  values.push(current.trim());
  return values;
}

export function payrollCsvTemplate() {
  return `${payrollCsvHeaders.join(",")}\r\nSS-001,Ada Nwankwo,ada@example.com,500000,40000,0,0,0,0,100000,0,0,0\r\n`;
}

export function parsePayrollCsv(content: string) {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { rows: [] as PayrollImportRow[], errors: ["The CSV file is empty."] };
  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const missing = payrollCsvHeaders.filter((header) => !header.endsWith("_relief") && !headers.includes(header));
  if (missing.length) return { rows: [] as PayrollImportRow[], errors: [`Missing columns: ${missing.join(", ")}.`] };
  const indexOf = (header: typeof payrollCsvHeaders[number]) => headers.indexOf(header);
  const rows: PayrollImportRow[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  lines.slice(1).forEach((line, offset) => {
    const rowNumber = offset + 2;
    const values = parseCsvLine(line);
    const text = (header: typeof payrollCsvHeaders[number]) => values[indexOf(header)]?.trim() ?? "";
    const amount = (header: typeof payrollCsvHeaders[number]) => Number(text(header) || 0);
    const employeeNumber = text("employee_number");
    const fullName = text("full_name");
    if (!employeeNumber || !fullName) errors.push(`Row ${rowNumber}: employee_number and full_name are required.`);
    if (seen.has(employeeNumber)) errors.push(`Row ${rowNumber}: duplicate employee_number ${employeeNumber}.`);
    seen.add(employeeNumber);
    const moneyFields = payrollCsvHeaders.filter((header) => header.startsWith("monthly_") || header.endsWith("_relief"));
    if (moneyFields.some((header) => !Number.isFinite(amount(header)) || amount(header) < 0)) errors.push(`Row ${rowNumber}: pay and deduction amounts must be zero or positive numbers.`);
    rows.push({ rowNumber, employeeNumber, fullName, email: text("email") || undefined, monthlyGross: amount("monthly_gross"), monthlyPension: amount("monthly_pension"), monthlyNhf: amount("monthly_nhf"), monthlyNhis: amount("monthly_nhis"), monthlyMortgageInterest: amount("monthly_mortgage_interest"), monthlyLifeInsurance: amount("monthly_life_insurance"), monthlyRent: amount("monthly_rent"), monthlyOtherDeductions: amount("monthly_other_deductions"), annualMortgageInterestRelief: amount("annual_mortgage_interest_relief"), precedingYearLifeInsuranceRelief: amount("preceding_year_life_insurance_relief") });
  });
  return { rows, errors };
}

const validMoney = (value: number) => Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : 0;

export function calculatePayrollLine(employee: PayrollEmployeeInput): PayrollLine {
  const monthlyGross = validMoney(employee.monthlyGross);
  const monthlyPension = validMoney(employee.monthlyPension);
  const monthlyNhf = validMoney(employee.monthlyNhf);
  const monthlyNhis = validMoney(employee.monthlyNhis);
  const monthlyMortgageInterest = validMoney(employee.monthlyMortgageInterest);
  const monthlyLifeInsurance = validMoney(employee.monthlyLifeInsurance);
  const monthlyOtherDeductions = validMoney(employee.monthlyOtherDeductions);
  const result = calculatePaye({
    annualGrossIncome: monthlyGross * 12,
    pensionContribution: monthlyPension * 12,
    nhfContribution: monthlyNhf * 12,
    nhisContribution: monthlyNhis * 12,
    mortgageInterest: validMoney(employee.annualMortgageInterestRelief ?? 0),
    lifeInsurancePremium: validMoney(employee.precedingYearLifeInsuranceRelief ?? 0),
    annualRentPaid: validMoney(employee.monthlyRent) * 12,
  });
  const monthlyStatutoryDeductions = Math.round((monthlyPension + monthlyNhf + monthlyNhis + monthlyMortgageInterest + monthlyLifeInsurance) * 100) / 100;

  return {
    ...employee,
    monthlyGross,
    monthlyPension,
    monthlyNhf,
    monthlyNhis,
    monthlyMortgageInterest,
    monthlyLifeInsurance,
    monthlyOtherDeductions,
    monthlyPaye: Math.round(result.monthlyTax * 100) / 100,
    monthlyStatutoryDeductions,
    monthlyNetPay: Math.max(0, Math.round((monthlyGross - Math.round(result.monthlyTax * 100) / 100 - monthlyStatutoryDeductions - monthlyOtherDeductions) * 100) / 100),
    rulesetVersion,
  };
}

export function payrollTotals(lines: PayrollLine[]) {
  return lines.reduce((totals, line) => ({
    gross: totals.gross + line.monthlyGross,
    paye: totals.paye + line.monthlyPaye,
    deductions: totals.deductions + line.monthlyStatutoryDeductions + line.monthlyOtherDeductions,
    net: totals.net + line.monthlyNetPay,
  }), { gross: 0, paye: 0, deductions: 0, net: 0 });
}

function csvCell(value: string | number) {
  const text = typeof value === "string" && /^[=+@\-\t\r]/.test(value) ? `'${value}` : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export type PayrollExportStatus = "Draft" | "Finalised" | "Superseded";

export function buildPayrollCsv(period: string, organisation: string, lines: PayrollLine[], version = rulesetVersion, status: PayrollExportStatus = "Draft", revision?: number) {
  const rows: (string | number)[][] = [
    ["SalarySabi payroll schedule", organisation],
    ["Pay period", period],
    ["Status", status],
    ...(revision ? [["Revision", revision]] : []),
    ["Notice", "Calculation record only; not proof of payment or tax remittance."],
    ["Ruleset", version],
    [],
    ["Employee number", "Employee", "Gross pay", "PAYE", "Payroll deductions", "Other deductions", "Net pay"],
    ...lines.map((line) => [line.employeeNumber, line.fullName, line.monthlyGross.toFixed(2), line.monthlyPaye.toFixed(2), line.monthlyStatutoryDeductions.toFixed(2), line.monthlyOtherDeductions.toFixed(2), line.monthlyNetPay.toFixed(2)]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

const pdfMoney = (value: number) => `NGN ${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function downloadPayrollPayslip(organisation: string, period: string, line: PayrollLine, status: PayrollExportStatus = "Draft", revision?: number) {
  const { jsPDF } = await import("jspdf");
  const document = new jsPDF({ unit: "mm", format: "a4" });
  const left = 20;
  const right = 190;
  let y = 22;

  document.setTextColor(8, 86, 58);
  document.setFont("helvetica", "bold");
  document.setFontSize(11);
  document.text(`SALARYSABI PAYROLL - ${status.toUpperCase()}${revision ? ` - REVISION ${revision}` : ""}`, left, y);
  y += 10;
  document.setTextColor(16, 39, 29);
  document.setFontSize(22);
  document.text(organisation, left, y);
  y += 9;
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.setTextColor(86, 102, 94);
  document.text(`Payslip for ${period} | Ruleset ${line.rulesetVersion}`, left, y);
  y += 9;
  document.setDrawColor(8, 119, 71);
  document.setLineWidth(0.8);
  document.line(left, y, right, y);
  y += 14;

  document.setTextColor(16, 39, 29);
  document.setFont("helvetica", "bold");
  document.setFontSize(16);
  document.text(line.fullName, left, y);
  y += 7;
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.setTextColor(86, 102, 94);
  document.text(`Employee number: ${line.employeeNumber}`, left, y);
  y += 14;

  const row = (label: string, value: number, bold = false) => {
    document.setFont("helvetica", bold ? "bold" : "normal");
    document.setTextColor(16, 39, 29);
    document.text(label, left, y);
    document.text(pdfMoney(value), right, y, { align: "right" });
    document.setDrawColor(215, 224, 218);
    document.setLineWidth(0.25);
    document.line(left, y + 4, right, y + 4);
    y += 12;
  };

  row("Gross pay", line.monthlyGross);
  row("PAYE", line.monthlyPaye);
  row("Payroll deductions", line.monthlyStatutoryDeductions);
  row("Other deductions", line.monthlyOtherDeductions);
  y += 3;
  row("Net pay", line.monthlyNetPay, true);

  y += 8;
  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.setTextColor(86, 102, 94);
  const note = "Calculation record only. This document is not proof of salary payment, PAYE filing or statutory remittance.";
  document.text(document.splitTextToSize(note, right - left), left, y);
  document.save(`salarysabi-payslip-${period}-${status.toLowerCase()}${revision ? `-r${revision}` : ""}-${line.employeeNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
}
