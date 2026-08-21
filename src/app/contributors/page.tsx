import type { Metadata } from "next";
import { PublicPageShell } from "@/components/info-page";
import { ContributorProgram } from "@/components/contributor-program";

export const metadata: Metadata = {
  title: "Help Make Nigerian Pay Transparent | SalarySabi",
  description: "Contribute anonymous salary data or genuine Nigerian job leads. Funded SalarySabi offers pay only after evidence is approved.",
  alternates: { canonical: "/contributors" },
  openGraph: {
    title: "Help make Nigerian pay transparent",
    description: "Share an anonymous salary report or a verified Nigerian job lead. SalarySabi reviews every contribution before a reward is approved.",
    url: "/contributors",
    images: [{ url: "/contributors/opengraph-image", width: 1200, height: 630, alt: "SalarySabi funded contributor rewards" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Help make Nigerian pay transparent",
    description: "Submit genuine pay evidence, pass review and track your SalarySabi reward.",
    images: ["/contributors/opengraph-image"],
  },
};
export default function ContributorsPage() { return <PublicPageShell><ContributorProgram /></PublicPageShell>; }
