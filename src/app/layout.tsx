import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@/components/analytics";
import { founderGitHubUrl, founderLinkedInUrl, siteUrl } from "@/lib/site";
import "./globals.css";
import "./redesign.css";
import "./split-gateway.css";
import "./audience-system.css";
import "./pay-experience.css";

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
  title: "SalarySabi | Nigeria PAYE, Salaries and Jobs",
  description:
    "Calculate Nigerian PAYE and take-home pay, compare salaries, find jobs with published pay, and earn rewards for approved pay information.",
  keywords: [
    "Nigeria PAYE calculator 2026",
    "Nigerian salary calculator",
    "gross to net salary Nigeria",
    "PAYE tax calculator Nigeria",
    "jobs with salaries Nigeria",
    "Nigeria salary benchmarks",
  ],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    locale: "en_NG",
    title: "SalarySabi | Nigeria PAYE, Salaries and Jobs",
    description:
      "Understand your pay, compare salaries and find Nigerian jobs that publish pay.",
    url: "/",
    siteName: "SalarySabi",
  },
  twitter: {
    card: "summary_large_image",
    title: "SalarySabi | Nigeria PAYE, Salaries and Jobs",
    description:
      "Understand your pay, compare salaries and find Nigerian jobs that publish pay.",
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
      <head>
        <script
          async
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9638487224391154"
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteIdentity) }}
        />
        <Analytics />
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
