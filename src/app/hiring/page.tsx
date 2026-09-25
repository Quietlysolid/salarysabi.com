import { PublicPageShell } from "@/components/info-page";
import { EmployerHiring } from "@/components/employer-hiring";
export const metadata = { title: "Manage my listings | SalarySabi", robots: { index: false, follow: false } };
export default function HiringPage() { return <PublicPageShell><EmployerHiring /></PublicPageShell>; }
