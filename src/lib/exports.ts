import type { PayeInputs, PayeResult } from "./paye";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const today = () =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportRows(inputs: PayeInputs, result: PayeResult) {
  return [
    ["SalarySabi PAYE Calculation", ""],
    ["Calculation date", today()],
    ["Ruleset", "Nigeria Tax Act 2025 / JRB PIT Guidelines 2026"],
    ["", ""],
    ["Inputs", "Amount (NGN)"],
    ["Total annual emolument", result.annualGrossIncome],
    ["Pension contribution", inputs.pensionContribution ?? 0],
    ["NHF contribution", inputs.nhfContribution ?? 0],
    ["NHIS contribution", inputs.nhisContribution ?? 0],
    ["Qualifying mortgage interest", inputs.mortgageInterest ?? 0],
    ["Life assurance premium", inputs.lifeInsurancePremium ?? 0],
    ["Annual rent paid", inputs.annualRentPaid ?? 0],
    ["Calculated rent relief", result.rentRelief],
    ["", ""],
    ["Results", "Amount (NGN)"],
    ["Total eligible deductions", result.totalEligibleDeductions],
    ["Chargeable income", result.chargeableIncome],
    ["Annual PAYE", result.annualTax],
    ["Monthly PAYE", result.monthlyTax],
    ["Effective tax rate", `${(result.effectiveTaxRate * 100).toFixed(2)}%`],
    ["", ""],
    ["Tax band", "Rate", "Taxable amount (NGN)", "Tax (NGN)"],
    ...result.bands.map((band) => [
      band.label,
      `${Math.round(band.rate * 100)}%`,
      band.taxableAmount,
      band.tax,
    ]),
    ["", ""],
    [
      "Disclaimer",
      "Estimate only. Confirm filing and remittance obligations with the relevant tax authority or a qualified tax professional.",
    ],
  ];
}

const xmlEscape = (value: string | number) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export function buildExcelWorkbook(inputs: PayeInputs, result: PayeResult) {
  const rows = exportRows(inputs, result)
    .map(
      (row) =>
        `<Row>${row
          .map((cell) => {
            const isNumber = typeof cell === "number";
            return `<Cell><Data ss:Type="${isNumber ? "Number" : "String"}">${xmlEscape(cell)}</Data></Cell>`;
          })
          .join("")}</Row>`,
    )
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="PAYE Calculation">
  <Table>
   <Column ss:Width="210"/>
   <Column ss:Width="160"/>
   <Column ss:Width="150"/>
   <Column ss:Width="150"/>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function downloadExcel(inputs: PayeInputs, result: PayeResult) {
  download(
    new Blob([buildExcelWorkbook(inputs, result)], {
      type: "application/vnd.ms-excel;charset=utf-8",
    }),
    `salarysabi-paye-calculation-${new Date().toISOString().slice(0, 10)}.xls`,
  );
}

export async function downloadPdf(inputs: PayeInputs, result: PayeResult) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 18;
  let y = 20;

  const line = (
    label: string,
    value: string,
    options: { bold?: boolean; color?: [number, number, number] } = {},
  ) => {
    doc.setFont("helvetica", options.bold ? "bold" : "normal");
    doc.setTextColor(...(options.color ?? [30, 48, 40]));
    doc.text(label, left, y);
    doc.text(value, 192, y, { align: "right" });
    y += 7;
  };

  doc.setFillColor(8, 76, 56);
  doc.rect(0, 0, 210, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SalarySabi PAYE Calculation", left, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generated ${today()} | 2026 rules`, left, 27);

  y = 51;
  doc.setFontSize(12);
  line("Monthly PAYE", `NGN ${formatNumber(result.monthlyTax)}`, {
    bold: true,
    color: [8, 76, 56],
  });
  line("Annual PAYE", `NGN ${formatNumber(result.annualTax)}`, { bold: true });
  line(
    "Effective tax rate",
    `${(result.effectiveTaxRate * 100).toFixed(2)}%`,
  );

  y += 4;
  doc.setDrawColor(215, 221, 216);
  doc.line(left, y, 192, y);
  y += 10;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Annual breakdown", left, y);
  y += 9;
  doc.setFontSize(10);
  line("Total annual emolument", `NGN ${formatNumber(result.annualGrossIncome)}`);
  line(
    "Pension contribution",
    `NGN ${formatNumber(inputs.pensionContribution ?? 0)}`,
  );
  line("NHF contribution", `NGN ${formatNumber(inputs.nhfContribution ?? 0)}`);
  line("NHIS contribution", `NGN ${formatNumber(inputs.nhisContribution ?? 0)}`);
  line(
    "Qualifying mortgage interest",
    `NGN ${formatNumber(inputs.mortgageInterest ?? 0)}`,
  );
  line(
    "Life assurance premium",
    `NGN ${formatNumber(inputs.lifeInsurancePremium ?? 0)}`,
  );
  line("Annual rent paid", `NGN ${formatNumber(inputs.annualRentPaid ?? 0)}`);
  line("Calculated rent relief", `NGN ${formatNumber(result.rentRelief)}`, {
    color: [13, 104, 73],
  });
  line(
    "Total eligible deductions",
    `NGN ${formatNumber(result.totalEligibleDeductions)}`,
    { bold: true },
  );
  line("Chargeable income", `NGN ${formatNumber(result.chargeableIncome)}`, {
    bold: true,
  });

  y += 5;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Tax bands", left, y);
  y += 9;
  doc.setFontSize(9);
  result.bands.forEach((band) => {
    line(
      `${band.label} at ${Math.round(band.rate * 100)}%`,
      `NGN ${formatNumber(band.tax)}`,
    );
  });

  y += 4;
  doc.setDrawColor(215, 221, 216);
  doc.line(left, y, 192, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(95, 105, 100);
  const disclaimer =
    "Estimate based on the Nigeria Tax Act 2025 and JRB Personal Income Tax Guidelines 2026. This document is not tax advice or proof of remittance.";
  doc.text(doc.splitTextToSize(disclaimer, 174), left, y);

  doc.save(`salarysabi-paye-calculation-${new Date().toISOString().slice(0, 10)}.pdf`);
}
