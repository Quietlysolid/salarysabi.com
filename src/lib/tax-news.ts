export type TaxNewsArticle = {
  slug: string;
  title: string;
  summary: string;
  status: "Announced" | "Enacted" | "Guidance issued" | "Calculator updated";
  publishedDate: string;
  publishedIso: string;
  updatedDate: string;
  updatedIso: string;
  ruleset: string;
};

export const taxNewsArticles: TaxNewsArticle[] = [
  {
    slug: "nigeria-tax-act-2025-paycheck-2026",
    title: "How the Nigeria Tax Act affects your paycheck in 2026",
    summary: "The PAYE bands, minimum-wage exemption, rent relief and deductions that can change take-home pay from 1 January 2026.",
    status: "Calculator updated",
    publishedDate: "8 August 2026",
    publishedIso: "2026-08-08",
    updatedDate: "8 August 2026",
    updatedIso: "2026-08-08",
    ruleset: "2026.1",
  },
];

export function getTaxNewsArticle(slug: string) {
  return taxNewsArticles.find((article) => article.slug === slug);
}
