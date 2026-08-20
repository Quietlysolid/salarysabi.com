import Link from "next/link";
import { UsersRound } from "lucide-react";
import { Calculator } from "@/components/calculator";
import { PublicPageShell } from "@/components/info-page";
import { siteUrl } from "@/lib/site";

export const metadata = { alternates: { canonical: "/" } };

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SalarySabi Nigerian Work and Pay Platform",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: siteUrl,
    offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" },
    description: "Calculate Nigerian PAYE and take-home pay, check a payslip, compare salaries and find jobs that publish pay.",
  };

  return <PublicPageShell>
    <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} type="application/ld+json" />
    <div className="simple-home">
      <section className="simple-home-calculator" id="calculator" aria-label="Take-home pay calculator">
        <Calculator />
      </section>

      <aside className="home-contribution-note">
        <Link href="/contributors"><UsersRound aria-hidden="true" />Contribute an anonymous salary report</Link>
      </aside>
    </div>
  </PublicPageShell>;
}
