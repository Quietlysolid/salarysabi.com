// Temporary staging-only probe; outbound email is always simulated.
import { createClient } from "npm:@supabase/supabase-js@2";
import { runJobAlertBatch } from "../_shared/job-alert-runner.ts";
const url = Deno.env.get("SUPABASE_URL")!;
const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }) },
});
Deno.serve(async request => {
  if (url !== "https://vcgqxlbhsbilxlkratbw.supabase.co") return new Response("Staging only", { status: 403 });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { data: authorized } = await db.rpc("verify_job_alert_cron_secret", { p_secret: request.headers.get("x-cron-secret") || "" });
  if (!authorized) return new Response("Unauthorized", { status: 401 });
  const { alert_ids: ids, slow } = await request.json();
  if (!Array.isArray(ids) || ids.length > 1100 || !ids.length) return new Response("Invalid fixtures", { status: 400 });
  const result = await runJobAlertBatch({
    unsubscribeBase: url + "/functions/v1/send-job-alerts",
    claim: async () => { const r = await db.rpc("claim_job_alert_delivery", { p_alert_ids: ids }); if (r.error) throw r.error; return r.data; },
    begin: async d => { const r = await db.rpc("begin_job_alert_delivery", { p_id: d.id, p_token: d.claim_token }); if (r.error) throw r.error; return r.data; },
    finish: async (d, outcome, message, reason) => {
      const r = await db.rpc("finish_job_alert_delivery", { p_id: d.id, p_token: d.claim_token, p_outcome: outcome, p_message_id: message, p_error: reason });
      if (r.error || r.data !== true) throw r.error || new Error("Finish rejected");
    },
    send: async (_email, signal) => {
      if (slow) await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 9000);
        signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
      });
      return Response.json({ success: true, result: { message_id: "edge-mock-" + crypto.randomUUID() } });
    },
  });
  return Response.json(result);
});
