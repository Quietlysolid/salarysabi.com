import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Tax Calculator Disclaimer",
  description:
    "Important limitations of SalarySabi estimates and exported calculations.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <InfoPage
      eyebrow="Important"
      title="Calculator estimates are not tax advice"
      intro="SalarySabi is an independent educational tool. It is not operated, endorsed or certified by the Joint Revenue Board or a state revenue authority."
    >
      <section>
        <h2>Confirm your obligations</h2>
        <p>
          Results depend on the completeness and accuracy of the amounts
          entered. Benefits in kind, non-periodic payments, tax credits,
          residency, changes during the year and other circumstances may
          change the final liability.
        </p>
        <p>
          Employers and taxpayers should confirm filing, deduction and
          remittance obligations with the relevant tax authority or a
          qualified Nigerian tax professional.
        </p>
      </section>
      <section>
        <h2>Exports are calculation records</h2>
        <p>
          A downloaded PDF, workbook or printed result is not a tax return,
          assessment, tax-clearance certificate, payslip or evidence that PAYE
          has been remitted.
        </p>
      </section>
      <section>
        <h2>Rules can change</h2>
        <p>
          Tax legislation, administrative guidance and interpretations can
          change. Every result identifies the ruleset used, and the site shows
          when its calculation rules were last verified.
        </p>
      </section>
    </InfoPage>
  );
}
