import { PublicPageShell } from "@/components/info-page"; import { TaxPlanner } from "@/components/tax-planner";
export const metadata = { title: "Company Tax Calculator Nigeria 2026 | SalarySabi", description: "Check Nigerian small-company thresholds and estimate company income tax and development levy.", alternates: { canonical: "/company-tax" } };
export default function Page(){return <PublicPageShell><TaxPlanner mode="company" /></PublicPageShell>}
