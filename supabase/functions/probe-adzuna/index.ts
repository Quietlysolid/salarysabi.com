import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (request) => {
  const secret = request.headers.get("x-cron-secret") || "";
  const { data: authorized } = await db.rpc("verify_job_alert_cron_secret", { p_secret: secret });
  if (!authorized) return new Response("Unauthorized", { status: 401 });
  const appId = Deno.env.get("ADZUNA_APP_ID"); const appKey = Deno.env.get("ADZUNA_APP_KEY");
  if (!appId || !appKey) return Response.json({ error: "Adzuna credentials are not configured" }, { status: 503 });
  const endpoint = new URL("https://api.adzuna.com/v1/api/jobs/ng/search/1");
  endpoint.searchParams.set("app_id", appId); endpoint.searchParams.set("app_key", appKey);
  endpoint.searchParams.set("results_per_page", "50"); endpoint.searchParams.set("content-type", "application/json");
  const response = await fetch(endpoint, { headers: { Accept: "application/json", "User-Agent": "SalarySabi coverage verification" } });
  const body = await response.text();
  if (!response.ok) return Response.json({ country_code: "ng", supported: false, upstream_status: response.status, detail: body.slice(0, 800) });
  const payload = JSON.parse(body) as { count?: number; results?: Record<string, unknown>[] };
  const results = payload.results || [];
  const exact = results.filter((job) => Number(job.salary_min) > 0 && Number(job.salary_max) >= Number(job.salary_min) && Number(job.salary_is_predicted || 0) === 0).length;
  const predicted = results.filter((job) => Number(job.salary_min) > 0 && Number(job.salary_max) >= Number(job.salary_min) && Number(job.salary_is_predicted || 0) === 1).length;
  return Response.json({ country_code: "ng", supported: true, total_available: payload.count || 0, sample_returned: results.length, exact_salary_in_sample: exact, predicted_salary_in_sample: predicted });
});
