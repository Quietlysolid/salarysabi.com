import { PublicPageShell } from "@/components/info-page"; import { TaxPlanner } from "@/components/tax-planner";
export const metadata = { title: "Investment Withholding Tax Calculator Nigeria | SalarySabi", description: "Estimate withholding on Nigerian dividends, interest and royalties.", alternates: { canonical: "/investment-tax" } };
export default function Page(){return <PublicPageShell><TaxPlanner mode="investment" /></PublicPageShell>}
