import { PublicPageShell } from "@/components/info-page"; import { TaxPlanner } from "@/components/tax-planner";
export const metadata = { title: "Content Creator Tax Calculator Nigeria 2026 | SalarySabi", description: "Plan Nigerian personal income tax on creator, sponsorship and platform income.", alternates: { canonical: "/creator-tax" } };
export default function Page(){return <PublicPageShell><TaxPlanner mode="creator" /></PublicPageShell>}
