import { createClient } from "npm:@supabase/supabase-js@2";
import { buildJobAlertEmail } from "../_shared/job-alert-email.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cloudflareAccountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
const cloudflareEmailApiToken = Deno.env.get("CLOUDFLARE_EMAIL_API_TOKEN");
const fromAddress = Deno.env.get("JOB_ALERT_FROM") || "SalarySabi Jobs <jobs@salarysabi.com>";
const fromAddressMatch = fromAddress.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/);
const cloudflareFrom = fromAddressMatch
  ? { name: fromAddressMatch[1], address: fromAddressMatch[2] }
  : fromAddress;
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

Deno.serve(async (request) => {
  const requestUrl = new URL(request.url);
  if (request.method === "GET" && requestUrl.searchParams.has("unsubscribe")) {
    const token = requestUrl.searchParams.get("unsubscribe");
    const { data } = await supabase.rpc("unsubscribe_job_alert", { p_token: token });
    return Response.redirect(`https://salarysabi.com/account?unsubscribed=${data ? "1" : "0"}`, 302);
  }

  const cronSecret = request.headers.get("x-cron-secret") || "";
  const { data: authorized } = await supabase.rpc("verify_job_alert_cron_secret", { p_secret: cronSecret });
  if (!authorized) return new Response("Unauthorized", { status: 401 });
  if (!cloudflareAccountId || !cloudflareEmailApiToken) {
    return Response.json({ error: "Cloudflare Email Sending is not configured" }, { status: 503 });
  }

  const { data: alerts, error: alertError } = await supabase.from("job_alerts").select("*").eq("active", true).not("user_id", "is", null);
  if (alertError) return Response.json({ error: alertError.message }, { status: 500 });
  const { data: jobs, error: jobError } = await supabase.from("jobs").select("id,slug,title,company_name,location,work_mode,employment_type,salary_min,salary_max,salary_period,salary_type,salary_currency,published_at").eq("status", "published").gte("expires_at", new Date().toISOString().slice(0, 10));
  if (jobError) return Response.json({ error: jobError.message }, { status: 500 });

  let sent = 0;
  for (const alert of alerts ?? []) {
    const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id);
    const user = userData.user;
    if (!user?.email || !user.email_confirmed_at || user.email.toLowerCase() !== alert.email.toLowerCase()) continue;
    const { data: previous } = await supabase.from("job_notifications").select("job_id").eq("alert_id", alert.id);
    const notified = new Set((previous ?? []).map((item) => item.job_id));
    const words = String(alert.keywords).toLowerCase().split(/\s+/).filter(Boolean);
    const matches = (jobs ?? []).filter((job) => {
      const searchable = `${job.title} ${job.company_name} ${job.location} ${job.employment_type}`.toLowerCase();
      return !notified.has(job.id) && words.every((word) => searchable.includes(word)) && (!alert.location || job.location.toLowerCase().includes(alert.location.toLowerCase())) && (alert.work_mode === "all" || job.work_mode === alert.work_mode);
    });
    if (!matches.length) continue;

    const unsubscribeUrl = `${supabaseUrl}/functions/v1/send-job-alerts?unsubscribe=${alert.unsubscribe_token}`;
    const email = buildJobAlertEmail({ alertId: alert.id, recipient: user.email, keywords: alert.keywords, jobs: matches, unsubscribeUrl, date: new Date().toISOString().slice(0, 10) });
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/email/sending/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cloudflareEmailApiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: cloudflareFrom,
        to: email.to[0],
        subject: email.subject,
        html: email.html,
      }),
    });
    if (!response.ok) continue;
    const result = await response.json();
    await supabase.from("job_notifications").insert(matches.slice(0, 20).map((job) => ({ alert_id: alert.id, job_id: job.id, provider_message_id: result.result?.message_id ?? null })));
    await supabase.from("job_alerts").update({ last_sent_at: new Date().toISOString() }).eq("id", alert.id);
    sent += 1;
  }
  return Response.json({ alerts_processed: alerts?.length ?? 0, emails_sent: sent });
});
