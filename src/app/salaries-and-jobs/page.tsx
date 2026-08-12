import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";

export const metadata = { title: "Nigerian Salaries and Salary-Transparent Jobs | SalarySabi", description: "Compare anonymous Nigerian salary ranges, find jobs that publish pay and keep your job search organized.", alternates: { canonical: "/salaries-and-jobs" } };
const paths = [
  ["01", "Compare salaries", "See grouped salary ranges by role, location, industry and experience.", "/salaries", "Explore salary benchmarks"],
  ["02", "Find jobs that publish pay", "Browse reviewed openings where the salary is visible before you apply.", "/jobs", "Browse salary-transparent jobs"],
  ["03", "Keep track of your search", "Save jobs, record applications and create verified email alerts.", "/account", "Open your job workspace"],
];
export default function Page(){return <PublicPageShell><main className="product-hub"><header><span className="eyebrow">Salaries & jobs</span><h1>Know your worth before your next move.</h1><p>Compare what similar work pays, find opportunities that publish salary and keep your search in one place.</p></header><section className="product-hub-paths">{paths.map(([number,title,description,href,action])=><Link href={href} key={href}><span>{number}</span><h2>{title}</h2><p>{description}</p><strong>{action} →</strong></Link>)}</section><aside className="product-hub-note"><div><span className="eyebrow light">Help build transparency</span><h2>Share what you know without sharing who you are.</h2></div><div><Link href="/salaries">Share an anonymous salary</Link><Link href="/suggest-a-job">Share an existing job</Link></div></aside></main></PublicPageShell>}
