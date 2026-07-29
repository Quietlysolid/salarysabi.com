import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "How Nigerian PAYE Is Calculated in 2026",
  description:
    "Understand this PAYE calculation methodology: annual emolument, eligible deductions, rent relief and Nigeria's graduated 2026 tax bands.",
  alternates: { canonical: "/how-paye-is-calculated" },
};

export default function MethodologyPage() {
  return (
    <InfoPage
      eyebrow="Calculation methodology"
      title="How Nigerian PAYE is calculated in 2026"
      intro="This calculator follows a transparent annual calculation. It does not guess hidden deductions or apply one tax rate to your entire salary."
    >
      <section>
        <h2>The calculation in four steps</h2>
        <ol className="method-steps">
          <li>
            <span>01</span>
            <div>
              <h3>Determine total annual emolument</h3>
              <p>
                Monthly employment income is multiplied by 12. Annual mode
                uses the total annual emolument entered directly.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Subtract eligible deductions</h3>
              <p>
                We subtract only the actual annual amounts provided for
                pension, NHF, NHIS, qualifying mortgage interest and life
                assurance, plus calculated rent relief.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Apply the graduated tax bands</h3>
              <p>
                Each rate applies only to the portion of chargeable income
                inside that band. The first ₦800,000 is taxed at 0%.
              </p>
            </div>
          </li>
          <li>
            <span>04</span>
            <div>
              <h3>Divide annual PAYE by 12</h3>
              <p>
                Monthly PAYE is the resulting annual tax divided by 12. The
                engine preserves fractional values and the interface rounds
                displayed naira amounts for readability.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section>
        <h2>Rent relief</h2>
        <div className="formula">
          Rent relief = lower of 20% × annual rent paid or ₦500,000
        </div>
        <p>
          The calculator asks for annual rent paid and calculates the relief. The
          official JRB calculator instead asks users to enter the already
          calculated relief amount.
        </p>
      </section>

      <section>
        <h2>Sources and verification</h2>
        <p>
          The calculation engine is based on the Nigeria Tax Act 2025 and the
          Joint Revenue Board Personal Income Tax Guidelines 2026. It includes
          a regression fixture matching the official JRB example of ₦2.4
          million annual emolument, which produces ₦240,000 annual PAYE and
          ₦20,000 monthly PAYE.
        </p>
        <p>
          Review the <Link href="/tax-bands">complete 2026 tax bands</Link> or
          learn which amounts belong under{" "}
          <Link href="/eligible-deductions">eligible deductions</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
