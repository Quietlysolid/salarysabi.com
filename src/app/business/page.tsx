import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PublicPageShell } from "@/components/info-page";

export const metadata = { title: "Payroll, Company Tax and Salary-Transparent Hiring | SalarySabi", description: "SalarySabi tools for Nigerian small businesses: payroll records, company-tax planning and salary-transparent job listings.", alternates: { canonical: "/business" } };
const paths = [
  ["01", "Run small-team payroll", "Calculate PAYE, prepare registers, keep monthly history and generate payslips for up to 20 employees.", "/payroll", "Explore payroll"],
  ["02", "Plan company tax", "Check the small-company thresholds and estimate company tax on profit.", "/company-tax", "Open company-tax planner"],
  ["03", "Hire with salary transparency", "Publish a reviewed job where candidates can understand the pay before applying.", "/post-a-job", "Post a salary-transparent job"],
];
export default function Page(){return <PublicPageShell><main className="product-hub"><header><span className="eyebrow">For Nigerian businesses</span><h1>Handle pay clearly as your team grows.</h1><p>Practical tools for small employers preparing payroll, planning company tax and hiring with salary transparency.</p></header><section className="product-hub-paths">{paths.map(([number,title,description,href,action])=><Link href={href} key={href}><span>{number}</span><h2>{title}</h2><p>{description}</p><strong>{action} →</strong></Link>)}</section><aside className="product-hub-trust"><ShieldCheck aria-hidden="true"/><div><strong>What SalarySabi handles</strong><span>SalarySabi helps you calculate and keep records. Payments, tax filings and statutory remittances remain your responsibility.</span><Link href="/terms">View business responsibilities →</Link></div></aside></main></PublicPageShell>}
