import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@/components/analytics";
import { founderGitHubUrl, founderLinkedInUrl, siteUrl } from "@/lib/site";
import "./globals.css";
import "./redesign.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SalarySabi | Nigeria PAYE Calculator 2026",
  description:
    "Calculate Nigerian PAYE under the Nigeria Tax Act 2025, effective 2026. See monthly tax, rent relief, eligible deductions and every tax band.",
  keywords: [
    "Nigeria PAYE calculator 2026",
    "Nigerian salary calculator",
    "gross to net salary Nigeria",
    "PAYE tax calculator Nigeria",
  ],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    locale: "en_NG",
    title: "SalarySabi | Nigeria PAYE Calculator 2026",
    description:
      "Calculate monthly and annual Nigerian PAYE with transparent 2026 tax bands and eligible deductions.",
    url: "/",
    siteName: "SalarySabi",
  },
  twitter: {
    card: "summary",
    title: "SalarySabi | Nigeria PAYE Calculator 2026",
    description:
      "Free, transparent Nigerian PAYE calculations based on the 2026 rules.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const siteIdentity = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "SalarySabi",
        url: siteUrl,
        logo: `${siteUrl}/favicon.svg`,
        founder: { "@type": "Person", name: "Ozichi Nwosu", url: `${siteUrl}/about`, sameAs: [founderLinkedInUrl, founderGitHubUrl], jobTitle: "Software Engineer", alumniOf: { "@type": "CollegeOrUniversity", name: "University of Maryland Global Campus" } },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "SalarySabi",
        alternateName: "Salary Sabi",
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en-NG",
      },
    ],
  };

  return (
    <html className={`${sourceSans.variable} ${bricolageGrotesque.variable}`} lang="en-NG" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteIdentity) }}
        />
        <Analytics />
        <div id="main-content" tabIndex={-1}>{children}</div>
      </body>
    </html>
  );
}
