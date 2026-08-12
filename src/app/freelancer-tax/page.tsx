import { PublicPageShell } from "@/components/info-page"; import { TaxPlanner } from "@/components/tax-planner";
export const metadata = { title: "Freelancer Tax Calculator Nigeria 2026 | SalarySabi", description: "Estimate Nigerian personal income tax on freelance and professional profit under the 2026 rules.", alternates: { canonical: "/freelancer-tax" } };
export default function Page(){return <PublicPageShell><TaxPlanner mode="freelancer" /></PublicPageShell>}
