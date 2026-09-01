import { describe, expect, it } from "vitest";
import { buildPayrollCsv, calculatePayrollLine, parsePayrollCsv, payrollCsvTemplate, payrollTotals } from "./payroll";

const employee = {
  id: "employee-1",
  employeeNumber: "SS-001",
  fullName: "Ada Nwankwo",
  monthlyGross: 500_000,
  monthlyPension: 40_000,
  monthlyNhf: 0,
  monthlyNhis: 0,
  monthlyMortgageInterest: 0,
  monthlyLifeInsurance: 0,
  monthlyRent: 100_000,
  monthlyOtherDeductions: 10_000,
};

// Independent reference outputs transcribed from the Examples sheet in
// Payroll-PAYE-Nigeria.xlsx. That workbook assumes pension is 8% of gross.
const independentWorkbookCases = [
  { monthlyGross: 50_000, expectedPaye: 0, expectedNet: 46_000 },
  { monthlyGross: 100_000, expectedPaye: 3_800, expectedNet: 88_200 },
  { monthlyGross: 250_000, expectedPaye: 24_500, expectedNet: 205_500 },
  { monthlyGross: 500_000, expectedPaye: 65_300, expectedNet: 394_700 },
  { monthlyGross: 1_000_000, expectedPaye: 148_100, expectedNet: 771_900 },
  { monthlyGross: 2_000_000, expectedPaye: 338_900, expectedNet: 1_501_100 },
] as const;

describe("small-team payroll", () => {
  it("reuses the PAYE engine and subtracts payroll deductions from net pay", () => {
    const line = calculatePayrollLine(employee);
    expect(line.monthlyPaye).toBeGreaterThan(0);
    expect(line.monthlyNetPay).toBeCloseTo(500_000 - 40_000 - 10_000 - line.monthlyPaye, 2);
  });

  it.each(independentWorkbookCases)(
    "matches the independent workbook at ₦$monthlyGross monthly gross",
    ({ monthlyGross, expectedPaye, expectedNet }) => {
      const monthlyPension = monthlyGross * 0.08;
      const line = calculatePayrollLine({
        id: `workbook-${monthlyGross}`,
        employeeNumber: `REF-${monthlyGross}`,
        fullName: "Anonymous reference case",
        monthlyGross,
        monthlyPension,
        monthlyNhf: 0,
        monthlyNhis: 0,
        monthlyMortgageInterest: 0,
        monthlyLifeInsurance: 0,
        monthlyRent: 0,
        monthlyOtherDeductions: 0,
      });

      expect(line.monthlyStatutoryDeductions).toBe(monthlyPension);
      expect(line.monthlyPaye).toBeCloseTo(expectedPaye, 2);
      expect(line.monthlyNetPay).toBeCloseTo(expectedNet, 2);
    },
  );

  it("totals a payroll run", () => {
    const line = calculatePayrollLine(employee);
    expect(payrollTotals([line, { ...line, id: "employee-2" }]).gross).toBe(1_000_000);
  });

  it("exports the period, ruleset and employee figures", () => {
    const csv = buildPayrollCsv("2026-08", "Clear Pay Limited", [calculatePayrollLine(employee)]);
    expect(csv).toContain("SalarySabi payroll schedule,Clear Pay Limited");
    expect(csv).toContain("2026-08");
    expect(csv).toContain("Ada Nwankwo");
  });

  it("parses the employee import template", () => {
    const result = parsePayrollCsv(payrollCsvTemplate());
    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({ employeeNumber: "SS-001", fullName: "Ada Nwankwo", monthlyGross: 500_000 });
  });

  it("rejects duplicate employee numbers in one import", () => {
    const template = payrollCsvTemplate();
    const result = parsePayrollCsv(`${template}SS-001,Another Person,,400000,0,0,0,0,0,0,0\n`);
    expect(result.errors.join(" ")).toContain("duplicate employee_number SS-001");
  });
});
