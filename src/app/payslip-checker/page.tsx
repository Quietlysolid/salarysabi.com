import type { Metadata } from "next";
import { InfoFooter, InfoHeader } from "@/components/info-page";
import { PayslipChecker } from "@/components/payslip-checker";

export const metadata: Metadata = {
  title: "Check Your Nigerian Payslip | SalarySabi",
  description: "Compare the PAYE and deductions on your Nigerian payslip with a private SalarySabi estimate.",
  alternates: { canonical: "/payslip-checker" },
};

export default function PayslipCheckerPage() {
  return (
    <main>
      <InfoHeader />
      <section className="form-page-hero payslip-hero">
        <span className="eyebrow">Payslip checker</span>
        <h1>Check the deductions on your payslip.</h1>
        <p>Enter the monthly figures from your payslip and compare the PAYE shown with our estimate.</p>
      </section>
      <PayslipChecker />
      <InfoFooter />
    </main>
  );
}
