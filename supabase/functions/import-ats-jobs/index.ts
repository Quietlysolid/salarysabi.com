import { createClient } from "npm:@supabase/supabase-js@2";
import { atsSlug, canonicalizeJobUrl, isNigeriaRelevant, jobDedupeKey, salaryFromText, type AtsProvider } from "../_shared/job-source.ts";
import { inferWorkMode, normalizeEmploymentType, stripHtml } from "../_shared/jooble.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

type Source = { id: string; provider: AtsProvider; source_key: string; company_name: string; nigeria_only: boolean };
type NormalizedJob = { sourceId: string; title: string; company: string; location: string; description: string; url: string; employmentType?: string };
type SourceResult = { sourceId: string; company: string; received: number; nigeriaRelevant: number; salaryEligible: number; drafted: number; removedIneligible: number; duplicates: number; invalid: number; failures: string[] };

async function isAdminRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!token) return false;
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return false;
  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", userData.user.id).maybeSingle();
  return Boolean(admin);
}

async function greenhouse(source: Source): Promise<NormalizedJob[]> {
  const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.source_key)}/jobs?content=true`);
  if (!response.ok) throw new Error(`Greenhouse returned ${response.status}`);
  const payload = await response.json() as { jobs?: Array<{ id: number; title?: string; location?: { name?: string }; content?: string; absolute_url?: string; departments?: Array<{ name?: string }> }> };
  return (payload.jobs || []).map(job => ({ sourceId: String(job.id), title: stripHtml(job.title), company: source.company_name, location: stripHtml(job.location?.name), description: stripHtml(job.content), url: job.absolute_url || "" }));
}

async function lever(source: Source): Promise<NormalizedJob[]> {
  const response = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(source.source_key)}?mode=json`);
  if (!response.ok) throw new Error(`Lever returned ${response.status}`);
  const jobs = await response.json() as Array<{ id: string; text?: string; hostedUrl?: string; descriptionPlain?: string; additionalPlain?: string; categories?: { location?: string; commitment?: string } }>;
  return jobs.map(job => ({ sourceId: String(job.id), title: stripHtml(job.text), company: source.company_name, location: stripHtml(job.categories?.location), description: stripHtml(`${job.descriptionPlain || ""} ${job.additionalPlain || ""}`), url: job.hostedUrl || "", employmentType: job.categories?.commitment }));
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const { data: cronAuthorized } = await supabase.rpc("verify_job_alert_cron_secret", { p_secret: request.headers.get("x-cron-secret") || "" });
  const adminAuthorized = cronAuthorized ? false : await isAdminRequest(request);
  if (!cronAuthorized && !adminAuthorized) return json({ error: "Unauthorized" }, 401);

  let sourceId = "";
  try {
    const body = await request.json() as { sourceId?: unknown };
    sourceId = typeof body.sourceId === "string" ? body.sourceId : "";
  } catch {
    sourceId = "";
  }
  if (adminAuthorized && !sourceId) return json({ error: "Choose one ATS source to test and import." }, 400);

  let sourceQuery = supabase.from("job_import_sources").select("id,provider,source_key,company_name,nigeria_only").eq("active", true);
  if (sourceId) sourceQuery = sourceQuery.eq("id", sourceId);
  const { data: sources, error } = await sourceQuery;
  if (error) return json({ error: error.message }, 500);
  if (sourceId && !sources?.length) return json({ error: "This ATS source was not found or is inactive." }, 404);

  const result = { sources: sources?.length || 0, received: 0, nigeriaRelevant: 0, salaryEligible: 0, drafted: 0, removedIneligible: 0, duplicates: 0, skippedNoSalary: 0, skippedLocation: 0, invalid: 0, failures: [] as string[], sourceResults: [] as SourceResult[] };
  for (const source of (sources || []) as Source[]) {
    const sourceResult: SourceResult = { sourceId: source.id, company: source.company_name, received: 0, nigeriaRelevant: 0, salaryEligible: 0, drafted: 0, removedIneligible: 0, duplicates: 0, invalid: 0, failures: [] };
    try {
      const jobs = source.provider === "greenhouse" ? await greenhouse(source) : await lever(source);
      const eligibleSourceJobIds = new Set<string>();
      result.received += jobs.length;
      sourceResult.received = jobs.length;
      for (const job of jobs) {
        const url = canonicalizeJobUrl(job.url);
        const salary = salaryFromText(job.description);
        if (!url || !job.title || !job.company || job.description.length < 80) { result.invalid++; sourceResult.invalid++; continue; }
        if (source.nigeria_only && !isNigeriaRelevant(job.location, job.description)) { result.skippedLocation++; continue; }
        result.nigeriaRelevant++;
        sourceResult.nigeriaRelevant++;
        if (!salary) { result.skippedNoSalary++; continue; }
        result.salaryEligible++;
        sourceResult.salaryEligible++;
        const sourceJobId = `${source.provider}:${source.source_key}:${job.sourceId}`;
        eligibleSourceJobIds.add(sourceJobId);
        const dedupeKey = jobDedupeKey(job.title, job.company, job.location || "Nigeria");
        const { data: duplicate } = await supabase.rpc("find_job_duplicate", { p_dedupe_key: dedupeKey, p_canonical_url: url });
        if (duplicate?.length) { result.duplicates++; sourceResult.duplicates++; continue; }
        const now = new Date();
        const expires = new Date(now); expires.setUTCDate(expires.getUTCDate() + 30);
        const { error: insertError } = await supabase.from("jobs").insert({
          slug: atsSlug(source.provider, job.sourceId, job.title, job.company), title: job.title.slice(0,120), company_name: job.company.slice(0,120), location: (job.location || "Nigeria").slice(0,120),
          work_mode: inferWorkMode({ title: job.title, location: job.location, snippet: job.description }), employment_type: normalizeEmploymentType(job.employmentType), description: job.description.slice(0,8000),
          salary_min: salary.minimum, salary_max: salary.maximum, salary_period: salary.period, salary_type: "not_stated", salary_currency: "NGN", salary_source: "employer_disclosed",
          application_url: url, source_url: url, canonical_url: url, employer_verified: false, source_verified_at: now.toISOString(), source_last_seen_at: now.toISOString(), source_kind: "official_page",
          source_name: `${job.company} ${source.provider === "greenhouse" ? "Greenhouse" : "Lever"} careers`, source_job_id: sourceJobId, global_remote: /remote/i.test(job.location), engagement_type: "unknown",
          published_at: now.toISOString(), expires_at: expires.toISOString().slice(0,10), status: "draft", source_confidence: "high", verification_status: "pending", dedupe_key: dedupeKey,
        });
        if (insertError) {
          const failure = `${source.provider}:${job.sourceId}:${insertError.message}`;
          result.failures.push(failure);
          sourceResult.failures.push(failure);
        } else {
          result.drafted++;
          sourceResult.drafted++;
        }
      }
      // Remove only unpublished, unverified drafts from this exact ATS board
      // that no longer pass the current location and salary checks. Published
      // or manually verified listings are deliberately never touched here.
      const sourcePrefix = `${source.provider}:${source.source_key}:`;
      const { data: pendingDrafts, error: pendingDraftsError } = await supabase
        .from("jobs")
        .select("id,source_job_id")
        .eq("status", "draft")
        .eq("verification_status", "pending")
        .like("source_job_id", `${sourcePrefix}%`);
      if (pendingDraftsError) {
        const failure = `${source.provider}:${source.source_key}:cleanup:${pendingDraftsError.message}`;
        result.failures.push(failure);
        sourceResult.failures.push(failure);
      } else {
        const obsoleteIds = (pendingDrafts || [])
          .filter(job => typeof job.source_job_id === "string" && !eligibleSourceJobIds.has(job.source_job_id))
          .map(job => job.id);
        if (obsoleteIds.length) {
          const { error: cleanupError } = await supabase.from("jobs").delete().in("id", obsoleteIds);
          if (cleanupError) {
            const failure = `${source.provider}:${source.source_key}:cleanup:${cleanupError.message}`;
            result.failures.push(failure);
            sourceResult.failures.push(failure);
          } else {
            result.removedIneligible += obsoleteIds.length;
            sourceResult.removedIneligible += obsoleteIds.length;
          }
        }
      }

      const removedSummary = sourceResult.removedIneligible ? ` · ${sourceResult.removedIneligible} invalid drafts removed` : "";
      const summary = `${sourceResult.received} found · ${sourceResult.nigeriaRelevant} Nigeria-relevant · ${sourceResult.salaryEligible} with salary · ${sourceResult.drafted} drafted${removedSummary}`;
      await supabase.from("job_import_sources").update({ last_sync_at: new Date().toISOString(), last_sync_status: sourceResult.failures.length ? "warning" : "ok", last_sync_message: summary }).eq("id", source.id);
    } catch (sourceError) {
      const message = sourceError instanceof Error ? sourceError.message : "Unknown source error";
      const failure = `${source.provider}:${source.source_key}:${message}`;
      result.failures.push(failure);
      sourceResult.failures.push(failure);
      await supabase.from("job_import_sources").update({ last_sync_at: new Date().toISOString(), last_sync_status: "error", last_sync_message: message.slice(0,500) }).eq("id", source.id);
    }
    result.sourceResults.push(sourceResult);
  }
  return json(result);
});
