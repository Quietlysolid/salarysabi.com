import { createClient } from "npm:@supabase/supabase-js@2";
import { runJobAlertBatch } from "../_shared/job-alert-runner.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }) },
});
const account = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
const token = Deno.env.get("CLOUDFLARE_EMAIL_API_TOKEN");
const from = Deno.env.get("JOB_ALERT_FROM") || "SalarySabi Jobs <jobs@salarysabi.com>";
const match = from.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/);

Deno.serve(async (request) => {
  const url = new URL(request.url);
  if (request.method === "GET" && url.searchParams.has("unsubscribe")) {
    const { data, error } = await supabase.rpc("unsubscribe_job_alert", { p_token: url.searchParams.get("unsubscribe") });
    if (error) return Response.json({ error: "Could not update alert. Please try again." }, { status: 503 });
    return Response.redirect(`https://salarysabi.com/account?unsubscribed=${data ? "1" : "0"}`, 302);
  }
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { data: authorized, error } = await supabase.rpc("verify_job_alert_cron_secret", { p_secret: request.headers.get("x-cron-secret") || "" });
  if (error) return Response.json({ error: "Authorization unavailable" }, { status: 503 });
  if (!authorized) return new Response("Unauthorized", { status: 401 });
  if (!account || !token) return Response.json({ error: "Email sending is not configured" }, { status: 503 });
  try {
    const result = await runJobAlertBatch({
      unsubscribeBase: `${supabaseUrl}/functions/v1/send-job-alerts`,
      claim: async () => {
        const r = await supabase.rpc("claim_job_alert_delivery");
        if (r.error) throw r.error;
        return r.data;
      },
      begin: async d => {
        const r = await supabase.rpc("begin_job_alert_delivery", { p_id: d.id, p_token: d.claim_token });
        if (r.error) throw r.error;
        return r.data === true;
      },
      finish: async (d, outcome, messageId, reason) => {
        const r = await supabase.rpc("finish_job_alert_delivery", { p_id: d.id, p_token: d.claim_token, p_outcome: outcome, p_message_id: messageId, p_error: reason });
        if (r.error || r.data !== true) throw r.error || new Error("Delivery state rejected");
      },
      send: (email, signal) => fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/email/sending/send`, {
        method: "POST", signal,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: match ? { name: match[1], address: match[2] } : from, to: email.to[0], subject: email.subject, html: email.html }),
      }),
    });
    return Response.json(result, { status: result.uncertain || result.retryable ? 502 : result.complete ? 200 : 202 });
  } catch {
    console.error("Job alert batch stopped by a database error");
    return Response.json({ error: "Batch interrupted; durable delivery states retained" }, { status: 503 });
  }
});
