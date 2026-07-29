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
    title: "Pension contribution",
    text: "Enter the actual annual amount deducted and remitted to an approved Pension Fund Administrator.",
  },
  {
    title: "National Housing Fund (NHF)",
    text: "Enter the actual annual amount contributed to the National Housing Fund.",
  },
  {
    title: "National Health Insurance Scheme (NHIS)",
    text: "Enter the actual annual amount deducted and remitted.",
  },
  {
    title: "Qualifying mortgage interest",
    text: "Only the interest component for constructing, purchasing or developing an owner-occupied principal residence qualifies. Do not enter principal repayments.",
  },
  {
    title: "Life assurance premium",
    text: "The guidance permits qualifying annual premiums for the employee or spouse, subject to documentary evidence and applicable timing rules.",
  },
  {
    title: "Rent relief",
    text: "The relief is 20% of annual rent attributable to the year, capped at ₦500,000. The calculator derives this from annual rent paid.",
  },
];

export default function DeductionsPage() {
  return (
    <InfoPage
      eyebrow="Before tax bands"
      title="Eligible PAYE deductions explained"
      intro="Use actual annual amounts supported by appropriate records. The calculator does not infer statutory contributions from one gross salary figure."
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
        <strong>Keep supporting evidence.</strong>
        <p>
          A calculator estimate does not establish eligibility. The JRB
          guidance requires appropriate documentary evidence for deductions
          and prescribed information for rent relief.
        </p>
      </aside>
    </InfoPage>
  );
}
