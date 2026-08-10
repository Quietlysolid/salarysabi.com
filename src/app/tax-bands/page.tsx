import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { PayeGuideTrail } from "@/components/paye-guide-trail";

export const metadata: Metadata = {
  title: "Nigeria PAYE Tax Bands 2026",
  description:
    "See Nigeria's 2026 personal income tax bands and understand how graduated rates apply to chargeable income.",
  alternates: { canonical: "/tax-bands" },
};

const bands = [
  { band: "First ₦800,000", range: "₦0 to ₦800,000", rate: "0%", maximum: "₦0" },
  { band: "Next ₦2,200,000", range: "₦800,001 to ₦3,000,000", rate: "15%", maximum: "₦330,000" },
  { band: "Next ₦9,000,000", range: "₦3,000,001 to ₦12,000,000", rate: "18%", maximum: "₦1,620,000" },
  { band: "Next ₦13,000,000", range: "₦12,000,001 to ₦25,000,000", rate: "21%", maximum: "₦2,730,000" },
  { band: "Next ₦25,000,000", range: "₦25,000,001 to ₦50,000,000", rate: "23%", maximum: "₦5,750,000" },
  { band: "Amount above ₦50,000,000", range: "More than ₦50,000,000", rate: "25%", maximum: "No fixed maximum" },
] as const;

const exampleBands = [
  {
    className: "tax-bands-example-zero",
    label: "First ₦800,000",
    portion: "₦800,000",
    calculation: "₦800,000 × 0%",
    tax: "₦0",
  },
  {
    className: "tax-bands-example-fifteen",
    label: "Next ₦2,200,000",
    portion: "₦2,200,000",
    calculation: "₦2,200,000 × 15%",
    tax: "₦330,000",
  },
  {
    className: "tax-bands-example-eighteen",
    label: "Remaining ₦3,000,000",
    portion: "₦3,000,000",
    calculation: "₦3,000,000 × 18%",
    tax: "₦540,000",
  },
] as const;

export default function TaxBandsPage() {
  return (
    <InfoPage
      trail={<PayeGuideTrail current="bands" />}
      eyebrow="Nigeria Tax Act 2025"
      contents={[
        { href: "#worked-example", label: "How the bands combine" },
        { href: "#rates", label: "2026 rate table" },
        { href: "#chargeable-income", label: "Chargeable income" },
      ]}
      title="Nigeria’s PAYE tax bands for 2026"
      intro="PAYE uses graduated rates. Only the part of your chargeable income inside a band is taxed at that band’s rate."
    >
      <div className="tax-bands-page">
        <section id="worked-example" className="tax-bands-example">
          <div className="tax-bands-section-heading">
            <div>
              <span className="eyebrow">Worked example</span>
              <h2>See how ₦6 million is divided</h2>
            </div>
            <p>
              This example starts with <strong>₦6,000,000 in annual chargeable income</strong>,
              after eligible deductions. It is not a ₦6 million gross-salary example.
            </p>
          </div>

          <div className="tax-bands-stack" aria-label="How ₦6 million of chargeable income is divided across three tax bands">
            {exampleBands.map((band, index) => (
              <div className={band.className} key={band.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{band.portion}</strong>
                <small>{band.label}</small>
              </div>
            ))}
          </div>

          <div className="tax-bands-arithmetic" aria-label="Tax calculation for ₦6 million of chargeable income">
            {exampleBands.map((band) => (
              <div key={band.label}>
                <span>{band.label}</span>
                <strong>{band.calculation}</strong>
                <em>{band.tax} tax</em>
              </div>
            ))}
            <div className="tax-bands-total">
              <span>Total annual PAYE</span>
              <strong>₦870,000</strong>
              <em>14.5% of chargeable income</em>
            </div>
          </div>

          <aside className="tax-bands-rule">
            <strong>The 18% rate does not apply to all ₦6 million.</strong>
            <p>The first ₦800,000 remains at 0%, the next ₦2.2 million stays at 15%, and only the final ₦3 million reaches 18%.</p>
          </aside>
        </section>

        <section id="rates" className="tax-bands-reference">
          <div className="tax-bands-section-heading">
            <div>
              <span className="eyebrow">Reference table</span>
              <h2>Individual income-tax rates</h2>
            </div>
            <p>
              “Maximum tax in band” means the most tax that one fully used band can add.
              It is not your total tax bill.
            </p>
          </div>
          <div className="info-table tax-bands-table" role="table" aria-label="2026 PAYE bands">
            <div className="table-head" role="row">
              <span role="columnheader">Chargeable income band</span>
              <span role="columnheader">Income range</span>
              <span role="columnheader">Rate</span>
              <span role="columnheader">Maximum tax in band</span>
            </div>
            {bands.map(({ band, range, rate, maximum }) => (
              <div role="row" key={band}>
                <strong role="cell">{band}</strong>
                <span data-label="Income range" role="cell">{range}</span>
                <em data-label="Rate" role="cell">{rate}</em>
                <span data-label="Maximum tax in band" role="cell">{maximum}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="chargeable-income" className="tax-bands-definition">
          <span className="eyebrow">Before the rates apply</span>
          <h2>Chargeable income is not always gross salary</h2>
          <div>
            <p>
              Chargeable income is annual taxable employment income after eligible deductions
              and reliefs. That is the amount divided across the bands above.
            </p>
            <p>
              Check <Link href="/eligible-deductions">which deductions belong in the calculator</Link>,
              follow <Link href="/how-paye-is-calculated">the complete calculation method</Link>, or
              use the <Link href="/#calculator">free PAYE calculator</Link> to inspect your own band breakdown.
            </p>
          </div>
        </section>
      </div>
    </InfoPage>
  );
}
