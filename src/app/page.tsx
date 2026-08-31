import { SplitGatewayHome } from "@/components/split-gateway-home";
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
    description: "Calculate Nigerian PAYE and take-home pay, compare salaries, find jobs with published pay, run payroll or hire transparently.",
  };

  return <>
    <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} type="application/ld+json" />
    <SplitGatewayHome />
  </>;
}
