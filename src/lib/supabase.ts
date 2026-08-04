import { createClient } from "@supabase/supabase-js";

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
  const rows = await response.json();
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
