import { PublicPageShell } from "@/components/info-page"; import { SalaryBenchmarks } from "@/components/salary-benchmarks";
export const metadata={title:"Anonymous Nigerian Salary Data | SalarySabi",description:"Compare aggregated Nigerian salary ranges by role, industry, location and experience, with a five-report privacy threshold.",alternates:{canonical:"/salaries"}};
export default function Page(){return <PublicPageShell><SalaryBenchmarks/></PublicPageShell>}
