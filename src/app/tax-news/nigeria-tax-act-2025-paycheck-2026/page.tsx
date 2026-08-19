import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/info-page";
import { getTaxNewsArticle } from "@/lib/tax-news";
import { siteUrl } from "@/lib/site";

const article = getTaxNewsArticle("nigeria-tax-act-2025-paycheck-2026")!;
const canonicalPath = `/tax-news/${article.slug}`;

export const metadata: Metadata = {
  title: "How the Nigeria Tax Act Affects Your Paycheck in 2026",
  description: "See how Nigeria's 2026 PAYE bands, minimum-wage exemption, eligible deductions and rent relief can affect take-home pay.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "article",
    title: article.title,
    description: article.summary,
    url: canonicalPath,
    publishedTime: article.publishedIso,
    modifiedTime: article.updatedIso,
  },
};

export default function TaxActPaycheckExplainerPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedIso,
    dateModified: article.updatedIso,
    mainEntityOfPage: `${siteUrl}${canonicalPath}`,
    author: { "@type": "Person", name: "Ozichi Nwosu", url: `${siteUrl}/about` },
    publisher: { "@id": `${siteUrl}/#organization` },
  };

  return (
    <PublicPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <article className="tax-news-article">
        <header className="tax-news-article-hero">
          <Link href="/tax-news">Tax news and explainers</Link>
          <span className="eyebrow">Nigeria Tax Act 2025</span>
          <h1>{article.title}</h1>
          <p>{article.summary}</p>
          <div className="tax-news-byline"><span>By <Link href="/about">Ozichi Nwosu</Link></span><span>Published <time dateTime={article.publishedIso}>{article.publishedDate}</time></span><span>Ruleset {article.ruleset}</span></div>
        </header>

        <aside className="tax-news-answer">
          <strong>The short answer</strong>
          <p>From 1 January 2026, PAYE uses new graduated bands and eligible reliefs under the Nigeria Tax Act 2025. Your result depends on annual employment income, deductions you can support and the portion of chargeable income inside each band.</p>
        </aside>

        <div className="tax-news-article-body">
          <section>
            <h2>What changed?</h2>
            <p>The first ₦800,000 of annual chargeable income is taxed at 0%. Higher portions move through rates of 15%, 18%, 21%, 23% and 25%. These are marginal bands. Reaching a higher band does not put all your income at that rate.</p>
            <Link href="/tax-bands">See the full 2026 PAYE band table</Link>
          </section>
          <section>
            <h2>Who is exempt at minimum wage?</h2>
            <p>Employment income at or below the national minimum wage is exempt. SalarySabi&apos;s current ruleset applies this at ₦70,000 monthly or ₦840,000 yearly.</p>
            <p>This rule concerns employment income at the threshold. Other income or unusual circumstances may need professional review.</p>
          </section>
          <section>
            <h2>Which deductions can reduce chargeable income?</h2>
            <p>Eligible amounts can include pension, NHF, NHIS or NHIA contributions, qualifying mortgage interest and life-assurance premiums. Use figures you can confirm from a payslip, statement or receipt.</p>
            <Link href="/eligible-deductions">Check what belongs in each calculator field</Link>
          </section>
          <section>
            <h2>How does rent relief work?</h2>
            <p>Rent relief is 20% of annual rent paid, capped at ₦500,000 per year. Enter the rent you actually pay. SalarySabi calculates the relief rather than asking you to work it out first.</p>
          </section>
          <section>
            <h2>What does this mean for take-home pay?</h2>
            <p>There is no single answer for every worker. PAYE changes with income and eligible deductions. Net pay can also include pension, housing, health and other payroll deductions outside the PAYE figure.</p>
            <div className="tax-news-actions"><Link className="primary-button" href="/#calculator">Calculate your 2026 PAYE</Link><Link className="secondary-button" href="/payslip-checker">Check your payslip</Link></div>
          </section>
          <section className="tax-news-sources">
            <span className="eyebrow">Official sources</span>
            <h2>Check the documents</h2>
            <ul>
              <li><a href="https://www.jrb.gov.ng/policies-reforms" target="_blank" rel="noreferrer">Nigeria Tax Act 2025, Chapter Two</a></li>
              <li><a href="https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf" target="_blank" rel="noreferrer">JRB Personal Income Tax Guidelines 2026</a></li>
            </ul>
            <p>SalarySabi maps eligible deductions to paragraph 8, rent relief to paragraph 9, tax bands to Appendix 1 and the minimum-wage exemption to Nigeria Tax Act section 163(1)(t) and JRB Appendix 4.</p>
            <Link href="/how-paye-is-calculated#sources">Read the full calculation methodology and citations</Link>
          </section>
        </div>

        <footer className="tax-news-disclosure">
          <strong>About this explainer</strong>
          <p>Ozichi Nwosu is a software engineer, not an accountant or tax adviser. This article explains the rules used by SalarySabi and is not personal tax advice. No qualified tax professional has independently reviewed SalarySabi yet.</p>
          <Link href="/tax-updates">See the calculator changelog</Link>
        </footer>
      </article>
    </PublicPageShell>
  );
}
