import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { Analytics } from "@/components/analytics";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Nigeria PAYE Calculator 2026 | Free Salary Tax Calculator",
  description:
    "Calculate Nigerian PAYE under the Nigeria Tax Act 2025, effective 2026. See monthly tax, rent relief, eligible deductions and every tax band.",
  keywords: [
    "Nigeria PAYE calculator 2026",
    "Nigerian salary calculator",
    "gross to net salary Nigeria",
    "PAYE tax calculator Nigeria",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_NG",
    title: "Nigeria PAYE Calculator 2026",
    description:
      "Calculate monthly and annual Nigerian PAYE with transparent 2026 tax bands and eligible deductions.",
    url: "/",
    siteName: "Nigeria PAYE Calculator",
  },
  twitter: {
    card: "summary",
    title: "Nigeria PAYE Calculator 2026",
    description:
      "Free, transparent Nigerian PAYE calculations based on the 2026 rules.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <Analytics />
        {children}
      </body>
    </html>
  );
}
