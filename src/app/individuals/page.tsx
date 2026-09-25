import type { Metadata } from "next";
import { AudienceHome } from "@/components/split-gateway-home";

export const metadata: Metadata = {
  title: "Pay, Jobs and Salary Community | SalarySabi",
  description: "Calculate your take-home pay, find jobs with published salaries, and compare or privately share pay in the salary community.",
  alternates: { canonical: "/individuals" },
};

export default function IndividualsHomePage() {
  return <AudienceHome audience="talent" />;
}
