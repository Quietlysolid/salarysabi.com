import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getPublishedJobSlugs } from "@/lib/supabase";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [
    "",
    "/how-paye-is-calculated",
    "/tax-bands",
    "/eligible-deductions",
    "/privacy",
    "/disclaimer",
    "/jobs",
  ];

  const staticPages: MetadataRoute.Sitemap = pages.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date("2026-07-29"),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/privacy" || path === "/disclaimer" ? 0.4 : 0.8,
  }));
  const jobs = await getPublishedJobSlugs() as { slug: string; updated_at: string }[];
  return [...staticPages, ...jobs.map((job) => ({ url: `${siteUrl}/jobs/${job.slug}`, lastModified: new Date(job.updated_at), changeFrequency: "daily" as const, priority: 0.8 }))];
}
