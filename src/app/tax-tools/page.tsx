import { PublicPageShell } from "@/components/info-page";

export const metadata = { title: "Nigerian Tax Calculators 2026 | SalarySabi", description: "Planning calculators for Nigerian employees, freelancers, creators, foreign income, companies and investors.", alternates: { canonical: "/tax-tools" } };
const tools = [
  ["Salary or wages", "/payslip-checker", "Check PAYE and take-home figures against your payslip."],
  ["Freelance or creator income", "/freelancer-tax", "Estimate tax on business, platform or sponsorship income."],
  ["Foreign income", "/foreign-income-tax", "Convert foreign earnings and estimate Nigerian tax."],
  ["Investment income", "/investment-tax", "Estimate withholding on dividends, interest or royalties."],
  ["Company tax", "/company-tax", "Estimate tax on company profit."],
];
export default function TaxToolsPage() { return <PublicPageShell><div className="tool-index tax-tool-index"><header><h1>What do you need help with?</h1></header><div>{tools.map(([title, href, description]) => <a href={href} key={href}><strong>{title}</strong><p>{description}</p><b aria-hidden="true">→</b></a>)}</div></div></PublicPageShell>; }
