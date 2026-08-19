import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PublicPageShell } from "@/components/info-page";

export const metadata = { title: "Payroll, Company Tax and Salary-Transparent Hiring | SalarySabi", description: "SalarySabi tools for Nigerian small businesses: payroll records, company-tax planning and salary-transparent job listings.", alternates: { canonical: "/business" } };
const paths = [
  ["Run payroll", "Calculate PAYE and create payslips for up to 20 employees.", "/payroll"],
  ["Plan company tax", "Estimate company tax on profit.", "/company-tax"],
  ["Post a job", "Show candidates the salary before they apply.", "/post-a-job"],
];
export default function Page(){return <PublicPageShell><main className="product-hub product-hub--business"><header><h1>For businesses</h1></header><section className="product-hub-paths">{paths.map(([title,description,href])=><Link href={href} key={href}><h2>{title}</h2><p>{description} <b aria-hidden="true">→</b></p></Link>)}</section><aside className="product-hub-trust"><ShieldCheck aria-hidden="true"/><div><strong>Your responsibility</strong><span>SalarySabi calculates and keeps records. You handle payments, filings and remittances.</span><Link href="/terms">View responsibilities →</Link></div></aside></main></PublicPageShell>}
