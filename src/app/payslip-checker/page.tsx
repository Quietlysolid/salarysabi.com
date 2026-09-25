import { redirect } from "next/navigation";
export default async function LegacyPayslipPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const params = await searchParams;
  redirect(params.from === "calculator" ? "/calculator?mode=check&from=calculator" : "/calculator");
}
