import { PublicPageShell } from "@/components/info-page";

export const metadata = { title: "Nigerian Tax Calculators 2026 | SalarySabi", description: "Planning calculators for Nigerian employees, freelancers, creators, foreign income, companies and investors.", alternates: { canonical: "/tax-tools" } };
const tools = [
  ["Employee PAYE", "/#calculator", "Calculate take-home pay and inspect every 2026 band."],
  ["Freelancer", "/freelancer-tax", "Estimate personal tax on business profit."],
  ["Creator", "/creator-tax", "Plan for platform, sponsorship and production income."],
  ["Foreign income", "/foreign-income-tax", "Convert foreign earnings and estimate Nigerian personal tax."],
  ["Company", "/company-tax", "Check small-company thresholds and estimate tax on profit."],
  ["Investment", "/investment-tax", "Estimate withholding on dividends, interest or royalties."],
];
export default function TaxToolsPage() { return <PublicPageShell><main className="tool-index"><header><span className="eyebrow">SalarySabi tax tools</span><h1>Start with how you earn.</h1><p>Choose a focused calculator. Every result shows its assumptions and limitations.</p></header><div>{tools.map(([title, href, description]) => <a href={href} key={href}><span>{String(tools.findIndex((tool) => tool[1] === href) + 1).padStart(2, "0")}</span><strong>{title}</strong><p>{description}</p><b>Open calculator →</b></a>)}</div></main></PublicPageShell>; }
