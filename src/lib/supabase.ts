import { createClient } from "@supabase/supabase-js";
import type { Job } from "@/lib/jobs";

const jobsQuery = "select=*&order=published_at.desc";

const publicJobFields = [
  "id", "slug", "title", "company_name", "location", "work_mode", "employment_type",
  "salary_min", "salary_max", "salary_period", "salary_type", "salary_currency",
  "salary_source", "application_url", "source_url", "employer_verified", "source_verified_at",
  "published_at", "expires_at", "source_kind", "source_name", "canonical_url",
  "source_last_seen_at", "global_remote", "engagement_type", "deadline_status",
  "transparency_score", "transparency_notes", "verification_status", "updated_at",
].join(",");

export type PublishedJobsPage = {
  jobs: Partial<Job>[];
  total: number;
};

export async function getPublishedJobsPage(offset: number, limit: number): Promise<PublishedJobsPage | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const query = new URLSearchParams({
    select: publicJobFields,
    order: "published_at.desc",
    offset: String(offset),
    limit: String(limit),
  });

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/jobs?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const contentRange = response.headers.get("content-range");
    const total = Number(contentRange?.split("/")[1]);
    return {
      jobs: await response.json() as Partial<Job>[],
      total: Number.isFinite(total) ? total : 0,
    };
  } catch {
    return null;
  }
}

export async function getPublishedJobs(): Promise<Job[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/jobs?${jobsQuery}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return response.json() as Promise<Job[]>;
  } catch {
    return null;
  }
}

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  return createClient(url, key);
}

export async function getPublishedJobBySlug(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const response = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/jobs?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 300 } },
  );
  if (!response.ok) return null;
  const rows = await response.json() as Job[];
  return rows[0] ?? null;
}

export async function getPublishedJobSlugs() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/jobs?select=slug,updated_at&order=published_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 300 },
  });
  return response.ok ? response.json() : [];
}
