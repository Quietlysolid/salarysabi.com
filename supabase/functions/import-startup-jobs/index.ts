import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const apiKey = Deno.env.get("STARTUP_JOBS_API_KEY");
const allowedCurrencies = new Set(["NGN", "USD", "GBP", "EUR"]);

function slug(value: string, id: string) {
  return `${value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80)}-${id.replace(/[^a-z0-9]/gi, "").slice(-8).toLowerCase()}`;
}

function salary(job: Record<string, unknown>) {
  const structured = (job.salary_data || job.salaryData) as Record<string, unknown> | undefined;
  if (structured) {
    const currency = String(structured.currency || "").toUpperCase();
    const minimum = Number(structured.min_value ?? structured.min ?? structured.minimum);
    const maximum = Number(structured.max_value ?? structured.max ?? structured.maximum);
    const periodRaw = String(structured.unit || structured.period || "").toLowerCase();
    if (allowedCurrencies.has(currency) && minimum > 0 && maximum >= minimum && /month|year|annual/.test(periodRaw))
      return { currency, minimum, maximum, period: /month/.test(periodRaw) ? "monthly" : "annual" };
  }
  const raw = String(job.salary || "").replace(/,/g, " ");
  const currency = (raw.match(/\b(NGN|USD|GBP|EUR)\b/i)?.[1] || "").toUpperCase();
  const numbers = [...raw.matchAll(/(?:^|\s)(\d+(?:\.\d+)?)\s*([kKmM])?/g)].map((match) => Number(match[1]) * (match[2]?.toLowerCase() === "k" ? 1e3 : match[2]?.toLowerCase() === "m" ? 1e6 : 1));
  if (!allowedCurrencies.has(currency) || numbers.length < 2 || !/month|year|annual/i.test(raw)) return null;
  const [minimum, maximum] = numbers;
  if (!(minimum > 0 && maximum >= minimum)) return null;
  return { currency, minimum, maximum, period: /month/i.test(raw) ? "monthly" : "annual" };
}

Deno.serve(async (request) => {
  const secret = request.headers.get("x-cron-secret") || "";
  const { data: authorized } = await db.rpc("verify_job_alert_cron_secret", { p_secret: secret });
  if (!authorized) return new Response("Unauthorized", { status: 401 });
  if (!apiKey) return Response.json({ error: "STARTUP_JOBS_API_KEY is not configured" }, { status: 503 });

  let cursor = "";
  let imported = 0;
  let skippedWithoutPreciseSalary = 0;
  do {
    const endpoint = new URL("https://api.startup.jobs/v1/jobs");
    endpoint.searchParams.set("country", "NG");
    endpoint.searchParams.set("limit", "50");
    if (cursor) endpoint.searchParams.set("cursor", cursor);
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } });
    if (!response.ok) return Response.json({ error: `Startup Jobs returned ${response.status}` }, { status: 502 });
    const payload = await response.json() as Record<string, unknown>;
    const rows = (payload.data || payload.jobs || []) as Record<string, unknown>[];
    for (const source of rows) {
      const pay = salary(source);
      if (!pay) { skippedWithoutPreciseSalary++; continue; }
      const id = String(source.id || source.uuid || "");
      const title = String(source.title || "").trim();
      const company = String((source.company as Record<string, unknown>)?.name || source.company_name || source.company || "").trim();
      const sourceUrl = String(source.url || source.job_url || source.redirect_url || "");
      if (!id || !title || !company || !sourceUrl.startsWith("https://")) continue;
      const location = String(source.location || "Nigeria").trim();
      const remote = Boolean(source.remote) || /remote/i.test(location);
      const now = new Date();
      const expires = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
      const description = `${company} is hiring a ${title} for a role listed in ${location}. SalarySabi received this listing from Startup Jobs. Open the original listing for the complete duties, requirements and application process.`;
      const row = { source_name: "Startup Jobs", source_job_id: id, slug: slug(`${title}-${company}`, id), title, company_name: company, location, work_mode: remote ? "remote" : "onsite", employment_type: String(source.employment_type || source.job_type || "Full time"), description, salary_min: pay.minimum, salary_max: pay.maximum, salary_period: pay.period, salary_type: "gross", salary_currency: pay.currency, salary_source: "source_reported", application_url: sourceUrl, source_url: sourceUrl, canonical_url: sourceUrl, source_kind: "licensed_feed", source_last_seen_at: now.toISOString(), source_verified_at: now.toISOString(), employer_verified: false, global_remote: remote && !/nigeria/i.test(location), engagement_type: "unknown", expires_at: expires };
      const { data: existing } = await db.from("jobs").select("id,status").eq("source_name", "Startup Jobs").eq("source_job_id", id).maybeSingle();
      const result = existing ? await db.from("jobs").update({ ...row, status: existing.status === "published" ? "published" : "draft" }).eq("id", existing.id) : await db.from("jobs").insert({ ...row, status: "draft" });
      if (!result.error) imported++;
    }
    cursor = String((payload.meta as Record<string, unknown>)?.next_cursor || payload.next_cursor || "");
  } while (cursor && imported < 500);

  await db.from("jobs").update({ status: "expired" }).eq("source_name", "Startup Jobs").eq("status", "published").lt("source_last_seen_at", new Date(Date.now() - 7 * 86400000).toISOString());
  return Response.json({ imported_for_review_or_refreshed: imported, skipped_without_precise_salary: skippedWithoutPreciseSalary });
});
