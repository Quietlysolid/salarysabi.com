import type { Metadata } from "next";
import { AudienceHome } from "@/components/split-gateway-home";

export const metadata: Metadata = {
  title: "Payroll, Company Tax and Transparent Hiring | SalarySabi",
  description: "Run small-team payroll, plan Nigerian company tax and publish salary-transparent roles.",
  alternates: { canonical: "/employers" },
};

export default function EmployerHomePage() {
  return <AudienceHome audience="employer" />;
}
