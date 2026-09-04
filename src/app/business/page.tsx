import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PublicPageShell } from "@/components/info-page";

export const metadata = { title: "Payroll, Company Tax and Salary-Transparent Hiring | SalarySabi", description: "SalarySabi tools for Nigerian small businesses: payroll records, company-tax planning and salary-transparent job listings.", alternates: { canonical: "/business" } };
const paths = [
  ["01", "Run payroll", "/payroll"],
  ["02", "Plan company tax", "/company-tax"],
  ["03", "Post a transparent job", "/post-a-job"],
];
export default function Page(){return <PublicPageShell><div className="product-hub product-hub--business"><header><span className="eyebrow">Employer tools</span><h1>Hire transparently and pay people correctly.</h1></header><section className="product-hub-paths">{paths.map(([number,title,href])=><Link href={href} key={href}><span>{number}</span><h2>{title}</h2><b aria-hidden="true">→</b></Link>)}</section><aside className="product-hub-trust"><ShieldCheck aria-hidden="true"/><div><strong>Know what SalarySabi handles</strong><span>SalarySabi calculates and keeps records. You remain responsible for payments, filings and remittances.</span><Link href="/terms">View responsibilities →</Link></div></aside></div></PublicPageShell>}
