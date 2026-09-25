import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }) },
});

Deno.serve(async request => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const started = Date.now();
  const result = { checked: 0, healthy: 0, expired: 0, heldForReview: 0, unavailable: 0, changed: 0, failures: [] as string[] };
  try {
    const auth = await supabase.rpc("verify_job_alert_cron_secret", { p_secret: request.headers.get("x-cron-secret") || "" });
    if (auth.error) throw auth.error;
    if (!auth.data) return new Response("Unauthorized", { status: 401 });
    while (result.checked < 20 && Date.now() - started < 20000) {
      const claimed = await supabase.rpc("claim_job_freshness");
      if (claimed.error) throw claimed.error;
      const job = claimed.data?.[0];
      if (!job) return Response.json(result);
      let status = 0;
      try {
        const response = await fetch(job.application_url, { redirect: "follow", signal: AbortSignal.timeout(8000),
          headers: { "user-agent": "SalarySabi job freshness checker/2.0 (+https://salarysabi.com/jobs)" } });
        status = response.status;
        await response.body?.cancel();
      } catch { /* An unavailable page is an observation, not a successful check. */ }
      const saved = await supabase.rpc("finish_job_freshness", { p_job_id: job.job_id, p_token: job.claim_token, p_status: status });
      if (saved.error) throw saved.error;
      result.checked++;
      const outcome = saved.data as "healthy" | "expired" | "heldForReview" | "unavailable" | "changed";
      result[outcome]++;
    }
    return Response.json(result, { status: 202 });
  } catch (error) {
    result.failures.push(error instanceof Error ? error.message : String((error as { message?: string }).message || error));
    return Response.json(result, { status: 503 });
  }
});
