import { PublicPageShell } from "@/components/info-page"; import { TaxPlanner } from "@/components/tax-planner";
export const metadata = { title: "Freelance and Creator Tax Calculator Nigeria | SalarySabi", description: "Estimate Nigerian personal income tax on freelance, creator and professional profit.", alternates: { canonical: "/freelancer-tax" } };
export default function Page(){return <PublicPageShell><TaxPlanner mode="freelancer" /></PublicPageShell>}
