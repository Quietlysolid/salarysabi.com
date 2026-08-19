import type { Metadata } from "next";
import { PublicPageShell } from "@/components/info-page";
import { PayrollWorkspace } from "@/components/payroll-workspace";

export const metadata: Metadata = {
  title: "Small Business Payroll | SalarySabi",
  description: "Calculate PAYE, prepare payroll schedules and generate payslips for a small Nigerian team.",
  alternates: { canonical: "/payroll" },
  robots: { index: false, follow: false },
};

export default function PayrollPage() {
  return <PublicPageShell><PayrollWorkspace /></PublicPageShell>;
}
