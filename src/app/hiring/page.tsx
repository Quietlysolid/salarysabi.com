import { PublicPageShell } from "@/components/info-page";
import { EmployerHiring } from "@/components/employer-hiring";
export const metadata = { title: "Manage my listings | SalarySabi", robots: { index: false, follow: false } };
export default async function HiringPage({ searchParams }: { searchParams: Promise<{ recovery?: string; from?: string }> }) {
  const { recovery, from } = await searchParams;
  return <PublicPageShell><EmployerHiring returnToDraft={from === "post-a-job"} initialRecovery={recovery === "1"} /></PublicPageShell>;
}
