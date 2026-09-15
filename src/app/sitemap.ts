import type { MetadataRoute } from "next";
import { legalContentUpdatedIso, rulesVerifiedIso, siteContentUpdatedIso, siteUrl } from "@/lib/site";
import { getPublishedJobSlugs } from "@/lib/supabase";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [
    { path: "", lastModified: siteContentUpdatedIso },
    { path: "/talent", lastModified: siteContentUpdatedIso },
    { path: "/employers", lastModified: siteContentUpdatedIso },
    { path: "/paye-guide", lastModified: siteContentUpdatedIso },
    { path: "/tax-tools", lastModified: rulesVerifiedIso },
    { path: "/salaries-and-jobs", lastModified: siteContentUpdatedIso },
    { path: "/business", lastModified: siteContentUpdatedIso },
    { path: "/freelancer-tax", lastModified: rulesVerifiedIso },
    { path: "/creator-tax", lastModified: rulesVerifiedIso },
    { path: "/foreign-income-tax", lastModified: rulesVerifiedIso },
    { path: "/company-tax", lastModified: rulesVerifiedIso },
    { path: "/investment-tax", lastModified: rulesVerifiedIso },
    { path: "/salaries", lastModified: siteContentUpdatedIso },
    { path: "/tax-news", lastModified: siteContentUpdatedIso },
    { path: "/tax-news/nigeria-tax-act-2025-paycheck-2026", lastModified: siteContentUpdatedIso },
    { path: "/how-paye-is-calculated", lastModified: rulesVerifiedIso },
    { path: "/tax-bands", lastModified: rulesVerifiedIso },
    { path: "/net-salary-vs-gross-salary-nigeria", lastModified: rulesVerifiedIso },
    { path: "/eligible-deductions", lastModified: rulesVerifiedIso },
    { path: "/privacy", lastModified: legalContentUpdatedIso },
    { path: "/disclaimer", lastModified: legalContentUpdatedIso },
    { path: "/about", lastModified: siteContentUpdatedIso },
    { path: "/contact", lastModified: siteContentUpdatedIso },
    { path: "/tax-updates", lastModified: siteContentUpdatedIso },
    { path: "/terms", lastModified: siteContentUpdatedIso },
    { path: "/security", lastModified: siteContentUpdatedIso },
    { path: "/accessibility", lastModified: siteContentUpdatedIso },
    { path: "/calculation-notes", lastModified: siteContentUpdatedIso },
    { path: "/jobs", lastModified: siteContentUpdatedIso },
    { path: "/payslip-checker", lastModified: siteContentUpdatedIso },
    { path: "/post-a-job", lastModified: siteContentUpdatedIso },
    { path: "/suggest-a-job", lastModified: siteContentUpdatedIso },
    { path: "/contributors", lastModified: siteContentUpdatedIso },
    { path: "/contributors/job-sourcing", lastModified: siteContentUpdatedIso },
  ];

  const staticPages: MetadataRoute.Sitemap = pages.map(({ path, lastModified }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(lastModified),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : ["/privacy", "/disclaimer", "/terms"].includes(path) ? 0.4 : 0.8,
  }));
  const jobs = await getPublishedJobSlugs() as { slug: string; updated_at: string }[];
  return [...staticPages, ...jobs.map((job) => ({ url: `${siteUrl}/jobs/${job.slug}`, lastModified: new Date(job.updated_at), changeFrequency: "daily" as const, priority: 0.8 }))];
}
