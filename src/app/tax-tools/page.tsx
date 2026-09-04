import { PublicPageShell } from "@/components/info-page";

export const metadata = { title: "Nigerian Tax Calculators 2026 | SalarySabi", description: "Planning calculators for Nigerian employees, freelancers, creators, foreign income, companies and investors.", alternates: { canonical: "/tax-tools" } };
const tools = [
  ["Salary or wages", "/payslip-checker"],
  ["Freelance or creator income", "/freelancer-tax"],
  ["Foreign income", "/foreign-income-tax"],
  ["Investment income", "/investment-tax"],
  ["Company tax", "/company-tax"],
];
export default function TaxToolsPage() { return <PublicPageShell><div className="tool-index tax-tool-index"><header><h1>What do you need help with?</h1></header><div>{tools.map(([title, href]) => <a href={href} key={href}><strong>{title}</strong><b aria-hidden="true">→</b></a>)}</div></div></PublicPageShell>; }
