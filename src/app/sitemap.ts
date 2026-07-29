import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/how-paye-is-calculated",
    "/tax-bands",
    "/eligible-deductions",
    "/privacy",
    "/disclaimer",
  ];

  return pages.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date("2026-07-29"),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/privacy" || path === "/disclaimer" ? 0.4 : 0.8,
  }));
}
