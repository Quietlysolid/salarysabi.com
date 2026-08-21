import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async request => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { data: authorized } = await supabase.rpc("verify_job_alert_cron_secret", { p_secret: request.headers.get("x-cron-secret") || "" });
  if (!authorized) return new Response("Unauthorized", { status: 401 });
  const { data: jobs, error } = await supabase.from("jobs").select("id,application_url,stale_check_failures").eq("status", "published").not("source_job_id", "is", null).limit(250);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const result = { checked: 0, healthy: 0, expired: 0, heldForReview: 0 };
  for (const job of jobs || []) {
    result.checked++;
    try {
      const response = await fetch(job.application_url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "user-agent": "SalarySabi job freshness checker/1.0 (+https://salarysabi.com/jobs)" } });
      if (response.ok) {
        result.healthy++;
        await supabase.from("jobs").update({ stale_check_failures: 0, last_availability_check_at: new Date().toISOString(), source_last_seen_at: new Date().toISOString() }).eq("id", job.id);
      } else if (response.status === 404 || response.status === 410) {
        result.expired++;
        await supabase.from("jobs").update({ status: "expired", stale_check_failures: (job.stale_check_failures || 0) + 1, last_availability_check_at: new Date().toISOString() }).eq("id", job.id);
      } else {
        const failures = (job.stale_check_failures || 0) + 1;
        if (failures >= 3) result.heldForReview++;
        await supabase.from("jobs").update({ status: failures >= 3 ? "draft" : "published", stale_check_failures: failures, last_availability_check_at: new Date().toISOString() }).eq("id", job.id);
      }
    } catch {
      const failures = (job.stale_check_failures || 0) + 1;
      if (failures >= 3) result.heldForReview++;
      await supabase.from("jobs").update({ status: failures >= 3 ? "draft" : "published", stale_check_failures: failures, last_availability_check_at: new Date().toISOString() }).eq("id", job.id);
    }
  }
  return Response.json(result);
});
