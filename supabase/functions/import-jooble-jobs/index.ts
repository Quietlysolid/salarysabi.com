import { createClient } from "npm:@supabase/supabase-js@2";
import {
  inferWorkMode,
  normalizeEmploymentType,
  parseNgnSalary,
  slugifyJob,
  stripHtml,
  type JoobleJob,
} from "../_shared/jooble.ts";
import { canonicalizeJobUrl, jobDedupeKey } from "../_shared/job-source.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const joobleApiKey = Deno.env.get("JOOBLE_API_KEY");
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const cronSecret = request.headers.get("x-cron-secret") || "";
  const { data: authorized } = await supabase.rpc("verify_job_alert_cron_secret", { p_secret: cronSecret });
  if (!authorized) return new Response("Unauthorized", { status: 401 });
  if (!joobleApiKey) return Response.json({ error: "JOOBLE_API_KEY is not configured" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const page = Math.max(1, Math.min(Number(body.page) || 1, 20));
  const resultOnPage = Math.max(1, Math.min(Number(body.resultOnPage) || 50, 100));
  const requestedSearches = Array.isArray(body.searches)
    ? body.searches
      .map((item: unknown) => item && typeof item === "object" ? item as { keywords?: unknown; location?: unknown } : {})
      .map((item: { keywords?: unknown; location?: unknown }) => ({
        keywords: String(item.keywords || "").trim(),
        location: String(item.location || "").trim(),
      }))
      .filter((item: { keywords: string; location: string }) => item.keywords && item.location)
      .slice(0, 10)
    : [];
  const searches = requestedSearches.length
    ? requestedSearches
    : [
      { keywords: "it", location: "Lagos" },
      { keywords: "manager", location: "Lagos" },
      { keywords: "accountant", location: "Lagos" },
      { keywords: "sales", location: "Abuja" },
    ];
  const payloads = await Promise.all(searches.map(async ({ keywords, location }: { keywords: string; location: string }) => {
    const response = await fetch(`https://jooble.org/api/${joobleApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, location, page: String(page), ResultOnPage: String(resultOnPage) }),
    });
    if (!response.ok) throw new Error(`Jooble request failed for ${keywords} in ${location}: ${response.status}`);
    return await response.json() as { jobs?: JoobleJob[]; totalCount?: number };
  })).catch((error) => ({ error: error instanceof Error ? error.message : "Jooble request failed" }));
  if ("error" in payloads) return Response.json({ error: payloads.error }, { status: 502 });
  const uniqueJobs = new Map<string, JoobleJob>();
  for (const payload of payloads) {
    for (const job of payload.jobs || []) uniqueJobs.set(String(job.id), job);
  }
  const jobs = [...uniqueJobs.values()];
  const now = new Date();
  let accepted = 0;
  let refreshed = 0;
  let skipped = 0;
  const failures: Array<{ id: string; reason: string }> = [];

  for (const job of jobs) {
    const salary = parseNgnSalary(job.salary);
    const title = stripHtml(job.title);
    const company = stripHtml(job.company);
    const location = stripHtml(job.location) || "Nigeria";
    const description = stripHtml(job.snippet);
    const link = canonicalizeJobUrl(job.link);
    if (!salary || !title || !company || !link || description.length < 80) {
      skipped += 1;
      failures.push({ id: String(job.id), reason: !salary ? "salary_not_supported" : "missing_required_detail" });
      continue;
    }

    const sourceId = String(job.id);
    const dedupeKey = jobDedupeKey(title, company, location);
    const { data: existing, error: lookupError } = await supabase.from("jobs").select("id").eq("source_name", "Jooble").eq("source_job_id", sourceId).maybeSingle();
    if (lookupError) {
      failures.push({ id: sourceId, reason: lookupError.message });
      continue;
    }
    if (existing) {
      const { error: refreshError } = await supabase
        .from("jobs")
        .update({ source_last_seen_at: now.toISOString(), expires_at: addDays(now, 30) })
        .eq("id", existing.id);
      if (refreshError) failures.push({ id: sourceId, reason: refreshError.message });
      else refreshed += 1;
      continue;
    }
    const { data: duplicates, error: duplicateError } = await supabase.rpc("find_job_duplicate", { p_dedupe_key: dedupeKey, p_canonical_url: link });
    if (duplicateError) { failures.push({ id: sourceId, reason: duplicateError.message }); continue; }
    if (duplicates?.length) { skipped += 1; failures.push({ id: sourceId, reason: "cross_source_duplicate" }); continue; }

    const record = {
      slug: slugifyJob(job),
      title: title.slice(0, 120),
      company_name: company.slice(0, 120),
      location: location.slice(0, 120),
      work_mode: inferWorkMode(job),
      employment_type: normalizeEmploymentType(job.type),
      description: description.slice(0, 8000),
      salary_min: salary.minimum,
      salary_max: salary.maximum,
      salary_period: salary.period,
      salary_type: "not_stated",
      salary_currency: "NGN",
      salary_source: "source_reported",
      application_url: link,
      source_url: link,
      canonical_url: link,
      employer_verified: false,
      source_verified_at: now.toISOString(),
      source_last_seen_at: now.toISOString(),
      source_kind: "licensed_feed",
      source_name: "Jooble",
      source_job_id: sourceId,
      dedupe_key: dedupeKey,
      source_confidence: "low",
      verification_status: "pending",
      global_remote: false,
      engagement_type: "unknown",
      published_at: now.toISOString(),
      expires_at: addDays(now, 30),
      status: "draft",
    };

    const { error } = await supabase.from("jobs").insert(record);
    if (error) failures.push({ id: sourceId, reason: error.message });
    else accepted += 1;
  }

  return Response.json({
    source: "Jooble",
    searches,
    total_available_across_queries: payloads.reduce((sum, payload) => sum + (payload.totalCount || 0), 0),
    received: jobs.length,
    accepted_as_draft: accepted,
    existing_refreshed: refreshed,
    skipped,
    failures: failures.slice(0, 20),
  });
});
