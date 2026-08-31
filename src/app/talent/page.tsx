import type { Metadata } from "next";
import { AudienceHome } from "@/components/split-gateway-home";

export const metadata: Metadata = {
  title: "Understand Your Pay and Find Better-Paying Work | SalarySabi",
  description: "Calculate your take-home pay, compare Nigerian salary ranges and find jobs that publish the salary before you apply.",
  alternates: { canonical: "/talent" },
};

export default function TalentHomePage() {
  return <AudienceHome audience="talent" />;
}
