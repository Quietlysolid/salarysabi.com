import type { Metadata } from "next";
import { PublicPageShell } from "@/components/info-page";
import { PayslipChecker } from "@/components/payslip-checker";

export const metadata: Metadata = {
  title: "Check Your Nigerian Payslip | SalarySabi",
  description: "Compare the PAYE and deductions on your Nigerian payslip with a private SalarySabi estimate.",
  alternates: { canonical: "/payslip-checker" },
};

export default function PayslipCheckerPage() {
  return (
    <PublicPageShell>
      <PayslipChecker />
    </PublicPageShell>
  );
}
