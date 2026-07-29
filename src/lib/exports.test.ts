import { describe, expect, it } from "vitest";
import { calculatePaye } from "./paye";
import { buildExcelWorkbook } from "./exports";

describe("buildExcelWorkbook", () => {
  it("includes inputs, derived rent relief, results and tax bands", () => {
    const inputs = {
      annualGrossIncome: 6_000_000,
      pensionContribution: 480_000,
      annualRentPaid: 1_200_000,
    };
    const workbook = buildExcelWorkbook(inputs, calculatePaye(inputs));

    expect(workbook).toContain("Total annual emolument");
    expect(workbook).toContain("Calculated rent relief");
    expect(workbook).toContain(">240000<");
    expect(workbook).toContain("Monthly PAYE");
    expect(workbook).toContain("Next ₦9,000,000");
    expect(workbook).toContain("Estimate only");
  });
});
