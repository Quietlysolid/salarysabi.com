import { PublicPageShell } from "@/components/info-page"; import { TaxPlanner } from "@/components/tax-planner";
export const metadata = { title: "Foreign Income Tax Calculator Nigeria 2026 | SalarySabi", description: "Convert foreign earnings to naira and estimate Nigerian personal income tax.", alternates: { canonical: "/foreign-income-tax" } };
export default function Page(){return <PublicPageShell><TaxPlanner mode="foreign" /></PublicPageShell>}
