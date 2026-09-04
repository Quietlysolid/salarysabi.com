import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { taxNewsArticles } from "@/lib/tax-news";

export const metadata: Metadata = {
  title: "Nigeria Tax News and PAYE Explainers | SalarySabi",
  description: "Plain-language updates on Nigerian PAYE rules, tax legislation and what verified changes mean for workers' paychecks.",
  alternates: { canonical: "/tax-news" },
};

export default function TaxNewsPage() {
  return (
    <InfoPage
      eyebrow="Tax news and explainers"
      title="Tax change? We break down what it means for your pay."
      intro="We separate announcements from enacted law, link the official documents and say whether the SalarySabi calculator changed."
    >
      <div className="tax-news-page">
        <aside className="tax-news-standard">
          <strong>How we label updates</strong>
          <span>Announced</span>
          <span>Enacted</span>
          <span>Guidance issued</span>
          <span>Calculator updated</span>
        </aside>
        <section className="tax-news-list" aria-labelledby="tax-news-list-title">
          <div className="tax-news-list-heading">
            <span className="eyebrow">Latest explanation</span>
            <h2 id="tax-news-list-title">What changed, who it affects and when it starts</h2>
          </div>
          {taxNewsArticles.map((article) => (
            <article key={article.slug}>
              <div className="tax-news-meta"><span>{article.status}</span><time dateTime={article.updatedIso}>Updated {article.updatedDate}</time></div>
              <h3><Link href={`/tax-news/${article.slug}`}>{article.title}</Link></h3>
              <Link className="tax-news-read" href={`/tax-news/${article.slug}`}>Read the explainer</Link>
            </article>
          ))}
        </section>
        <section className="trust-section trust-contact">
          <div><span className="eyebrow">See a tax announcement?</span><h2>Send the official source.</h2></div>
          <a className="primary-button" href="mailto:tax@salarysabi.com?subject=Nigerian%20tax%20news%20source">Share a tax source</a>
        </section>
      </div>
    </InfoPage>
  );
}
