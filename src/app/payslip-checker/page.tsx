import type { Metadata } from "next";
import { PublicPageShell } from "@/components/info-page";
import { PayslipChecker } from "@/components/payslip-checker";

export const metadata: Metadata = {
  title: "Your Pay Check: Check Your Nigerian Payslip | SalarySabi",
  description: "Check whether the PAYE on your Nigerian payslip looks right, understand entered deductions and get practical questions for payroll.",
  alternates: { canonical: "/payslip-checker" },
};

export default function PayslipCheckerPage() {
  return (
    <PublicPageShell>
      <PayslipChecker />
    </PublicPageShell>
  );
}
