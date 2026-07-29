import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Nigeria PAYE Tax Bands 2026",
  description:
    "See Nigeria's 2026 personal income tax bands from 0% on the first ₦800,000 to 25% above ₦50 million.",
  alternates: { canonical: "/tax-bands" },
};

const bands = [
  ["First ₦800,000", "0%", "₦0"],
  ["Next ₦2,200,000", "15%", "₦330,000"],
  ["Next ₦9,000,000", "18%", "₦1,620,000"],
  ["Next ₦13,000,000", "21%", "₦2,730,000"],
  ["Next ₦25,000,000", "23%", "₦5,750,000"],
  ["Above ₦50,000,000", "25%", "Depends on income"],
];

export default function TaxBandsPage() {
  return (
    <InfoPage
      eyebrow="Nigeria Tax Act 2025"
      title="Nigeria’s PAYE tax bands for 2026"
      intro="The rates are graduated. Entering a higher band does not cause your entire income to be taxed at the higher rate."
    >
      <section>
        <h2>Individual income-tax rates</h2>
        <div className="info-table" role="table" aria-label="2026 PAYE bands">
          <div className="table-head" role="row">
            <span>Chargeable income band</span>
            <span>Rate</span>
            <span>Maximum tax in band</span>
          </div>
          {bands.map(([band, rate, maximum]) => (
            <div role="row" key={band}>
              <strong>{band}</strong>
              <em>{rate}</em>
              <span>{maximum}</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>What “chargeable income” means</h2>
        <p>
          Chargeable income is total annual taxable employment income after
          eligible deductions and reliefs. It is not always the same as gross
          salary.
        </p>
        <p>
          Read <Link href="/how-paye-is-calculated">our methodology</Link> or
          use the <Link href="/#calculator">free calculator</Link> to see each
          band applied separately.
        </p>
      </section>
    </InfoPage>
  );
}
