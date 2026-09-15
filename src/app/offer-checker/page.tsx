import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";
import { OfferChecker } from "@/components/offer-checker";
import { pitGuidelinesUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nigeria Salary Offer Checker 2026 | SalarySabi",
  description: "Check a Nigerian job offer: estimate take-home pay after PAYE and pension, budget for rent, and find the gross salary needed for your target net pay.",
  alternates: { canonical: "/offer-checker" },
};

export default function OfferCheckerPage() {
  return <PublicPageShell className="decision-page">
    <header className="decision-page-heading"><span className="eyebrow">SalarySabi Offer Checker · 2026</span><h1>Got an offer?<br />See what it really pays.</h1><p>Understand the money you’ll receive, what’s left after rent, and what to ask for.</p></header>
    <OfferChecker />
    <p className="decision-source">Estimates use the existing SalarySabi PAYE methodology and <a href={pitGuidelinesUrl} target="_blank" rel="noreferrer">JRB 2026 guidelines</a>. <Link href="/how-paye-is-calculated">Read the calculation method</Link>. This is a planning estimate, not tax advice or a market salary rating.</p>
  </PublicPageShell>;
}
