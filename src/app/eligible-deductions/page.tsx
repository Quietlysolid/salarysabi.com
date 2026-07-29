import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Nigeria PAYE Eligible Deductions 2026",
  description:
    "Understand pension, NHF, NHIS, mortgage interest, life assurance and rent relief when estimating Nigerian PAYE in 2026.",
  alternates: { canonical: "/eligible-deductions" },
};

const deductions = [
  {
    title: "Pension: money saved for your retirement",
    text: "Look for “Pension” on your payslip or PFA statement. Enter the amount deducted from your salary, not the total balance in your retirement account. For example, ₦40,000 monthly equals ₦480,000 yearly.",
  },
  {
    title: "NHF: a housing-fund deduction",
    text: "Look for “NHF” on your payslip. Enter the amount actually deducted. If your payslip does not show NHF, leave it at ₦0.",
  },
  {
    title: "NHIS or NHIA: national health insurance",
    text: "Enter the eligible health-insurance contribution shown on your payslip. An ordinary private HMO payment may not qualify, so check with payroll if you are unsure.",
  },
  {
    title: "Mortgage interest: interest on your main home",
    text: "Enter only the interest charged on a qualifying mortgage for the home you live in. Do not enter the full mortgage payment, the amount repaid on the loan, rent or a mortgage for an investment property.",
  },
  {
    title: "Life assurance: cover for you or your spouse",
    text: "Enter qualifying premiums shown on your insurer’s receipt or statement. Do not include car, travel or ordinary health insurance.",
  },
  {
    title: "Rent relief: part of your home rent",
    text: "Enter the rent paid for your home and SalarySabi calculates 20%, up to ₦500,000 yearly. For example, ₦1,200,000 annual rent gives ₦240,000 relief. This reduces taxable income; it is not a cash refund.",
  },
];

export default function DeductionsPage() {
  return (
    <InfoPage
      eyebrow="Before tax bands"
      title="Eligible PAYE deductions explained"
      intro="You do not need to know tax language. Use amounts shown on your payslip, PFA statement, lender statement or receipt. If an item does not apply to you, leave it at ₦0."
    >
      <section>
        <h2>What you can enter</h2>
        <div className="deduction-list">
          {deductions.map((deduction, index) => (
            <article key={deduction.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{deduction.title}</h3>
                <p>{deduction.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="callout">
        <strong>Use amounts you can confirm.</strong>
        <p>
          Keep the payslip, statement or receipt supporting each amount.
          SalarySabi provides an estimate; your employer or tax adviser can
          confirm whether a deduction applies to your situation.
        </p>
      </aside>
    </InfoPage>
  );
}
