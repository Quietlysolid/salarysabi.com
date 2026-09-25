import { createClient } from "npm:@supabase/supabase-js@2";
import { atsSlug, canonicalizeJobUrl, isNigeriaRelevant, jobDedupeKey, salaryFromText, type AtsProvider } from "../_shared/job-source.ts";
import { inferWorkMode, normalizeEmploymentType, stripHtml } from "../_shared/jooble.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }) },
});
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: corsHeaders });
type Source = { id: string; provider: AtsProvider; source_key: string; company_name: string; nigeria_only: boolean };
type NormalizedJob = { sourceId: string; title: string; company: string; location: string; description: string; url: string; employmentType?: string };

async function isAdminRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!token) return false;
  const user = await supabase.auth.getUser(token);
  if (user.error || !user.data.user) return false;
  const admin = await supabase.from("admin_users").select("user_id").eq("user_id", user.data.user.id).maybeSingle();
  if (admin.error) throw admin.error;
  return Boolean(admin.data);
}

async function fetchBoard(source: Source): Promise<NormalizedJob[]> {
  if (!/^[\w.-]+$/.test(source.source_key)) throw new Error("Invalid ATS board key");
  const url = source.provider === "greenhouse"
    ? `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.source_key)}/jobs?content=true`
    : `https://api.lever.co/v0/postings/${encodeURIComponent(source.source_key)}?mode=json`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) { await response.body?.cancel(); throw new Error(`ATS provider returned ${response.status}`); }
  // Reject oversized or partial feeds without ever treating them as an empty board.
  const reader = response.body?.getReader();
  if (!reader) throw new Error("ATS response has no body");
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8_000_000) throw new Error("ATS board exceeds the supported 8 MB snapshot size");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const data = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
  const payload = JSON.parse(new TextDecoder().decode(data));
  const rows = source.provider === "greenhouse" ? payload?.jobs : payload;
  if (!Array.isArray(rows) || rows.length > 10000 || rows.some(row => !row || typeof row !== "object" || !["number", "string"].includes(typeof row.id) || !String(row.id))) {
    throw new Error("ATS response is not a complete, valid jobs array");
  }
  if (source.provider === "greenhouse" && typeof payload.meta?.total === "number" && payload.meta.total !== rows.length) {
    throw new Error("ATS response contains an incomplete board");
  }
  if (rows.some(row => source.provider === "greenhouse"
    ? typeof row.title !== "string" || typeof row.absolute_url !== "string" || typeof row.content !== "string"
    : typeof row.text !== "string" || typeof row.hostedUrl !== "string" || typeof row.descriptionPlain !== "string")) {
    throw new Error("ATS job fields are missing or malformed; cleanup was not started");
  }
  return rows.map(job => source.provider === "greenhouse"
    ? { sourceId: String(job.id), title: stripHtml(job.title), company: source.company_name, location: stripHtml(job.location?.name), description: stripHtml(job.content), url: job.absolute_url || "" }
    : { sourceId: String(job.id), title: stripHtml(job.text), company: source.company_name, location: stripHtml(job.categories?.location), description: stripHtml(`${job.descriptionPlain || ""} ${job.additionalPlain || ""}`), url: job.hostedUrl || "", employmentType: job.categories?.commitment });
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const started = Date.now();
  let claim: { source: Source; token: string; phase: string } | null = null;
  const result = { sources: 0, received: 0, nigeriaRelevant: 0, salaryEligible: 0, drafted: 0, removedIneligible: 0, duplicates: 0, skippedNoSalary: 0, skippedLocation: 0, invalid: 0, failures: [] as string[], sourceResults: [] as unknown[], pending: false };
  try {
    const auth = await supabase.rpc("verify_job_alert_cron_secret", { p_secret: request.headers.get("x-cron-secret") || "" });
    if (auth.error) throw auth.error;
    const admin = auth.data ? false : await isAdminRequest(request);
    if (!auth.data && !admin) return json({ error: "Unauthorized" }, 401);
    const body = await request.json().catch(() => ({}));
    const sourceId = typeof body.sourceId === "string" ? body.sourceId : null;
    if (sourceId && !/^[0-9a-f-]{36}$/i.test(sourceId)) return json({ error: "Invalid source ID" }, 400);
    if (admin && !sourceId) return json({ error: "Choose one ATS source to test and import." }, 400);
    if (sourceId) {
      const source = await supabase.from("job_import_sources").select("id").eq("id", sourceId).eq("active", true).maybeSingle();
      if (source.error) throw source.error;
      if (!source.data) return json({ error: "This ATS source was not found or is inactive." }, 404);
    }
    const claimed = await supabase.rpc("claim_ats_import", { p_source_id: sourceId });
    if (claimed.error) throw claimed.error;
    claim = claimed.data;
    if (!claim) return json({ ...result, message: "No source is due, or an import is already running." });
    result.sources = 1;
    const { source, token } = claim;
    if (claim.phase === "fetch") {
      const jobs = await fetchBoard(source);
      result.received = jobs.length;
      const snapshot = [];
      for (const job of jobs) {
        const url = canonicalizeJobUrl(job.url), salary = salaryFromText(job.description);
        if (!url || !job.title || !job.company || job.description.length < 80) { result.invalid++; continue; }
        if (source.nigeria_only && !isNigeriaRelevant(job.location, job.description)) { result.skippedLocation++; continue; }
        result.nigeriaRelevant++;
        if (!salary) { result.skippedNoSalary++; continue; }
        result.salaryEligible++;
        snapshot.push({
          slug: atsSlug(source.provider, job.sourceId, job.title, job.company), title: job.title.slice(0,120), company_name: job.company.slice(0,120), location: (job.location || "Nigeria").slice(0,120),
          work_mode: inferWorkMode({ title: job.title, location: job.location, snippet: job.description }), employment_type: normalizeEmploymentType(job.employmentType), description: job.description.slice(0,8000),
          salary_min: salary.minimum, salary_max: salary.maximum, salary_period: salary.period,
          application_url: url, source_url: url, canonical_url: url,
          source_name: `${job.company} ${source.provider === "greenhouse" ? "Greenhouse" : "Lever"} careers`, source_job_id: `${source.provider}:${source.source_key}:${job.sourceId}`,
          global_remote: /remote/i.test(job.location), dedupe_key: jobDedupeKey(job.title.slice(0,120), job.company.slice(0,120), (job.location || "Nigeria").slice(0,120)),
        });
      }
      const saved = await supabase.rpc("save_ats_snapshot", { p_source_id: source.id, p_token: token, p_jobs: snapshot });
      if (saved.error) throw saved.error;
    }
    let done = false;
    for (let batch = 0; batch < 20 && Date.now() - started < 20000; batch++) {
      const advanced = await supabase.rpc("advance_ats_import", { p_source_id: source.id, p_token: token });
      if (advanced.error) throw advanced.error;
      result.drafted += advanced.data.drafted;
      result.duplicates += advanced.data.duplicates;
      result.removedIneligible += advanced.data.removedIneligible;
      if (advanced.data.done) { done = true; break; }
    }
    result.pending = !done;
    if (!done) {
      const released = await supabase.rpc("release_ats_import", { p_source_id: source.id, p_token: token });
      if (released.error) throw released.error;
    }
    result.sourceResults.push({ ...result, sourceResults: undefined, sourceId: source.id, company: source.company_name });
    return json(result, done ? 200 : 202);
  } catch (error) {
    const message = error instanceof Error ? error.message : String((error as { message?: string }).message || error);
    result.failures.push(message);
    if (claim) {
      const released = await supabase.rpc("release_ats_import", { p_source_id: claim.source.id, p_token: claim.token, p_error: message });
      if (released.error) result.failures.push(`Could not persist failure: ${released.error.message}`);
    }
    return json(result, 503);
  }
});
