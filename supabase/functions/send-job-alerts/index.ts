import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const fromAddress = Deno.env.get("JOB_ALERT_FROM") || "SalarySabi Jobs <jobs@updates.salarysabi.com>";
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);

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
  if (!resendApiKey) return Response.json({ error: "RESEND_API_KEY is not configured" }, { status: 503 });

  const { data: alerts, error: alertError } = await supabase.from("job_alerts").select("*").eq("active", true).not("user_id", "is", null);
  if (alertError) return Response.json({ error: alertError.message }, { status: 500 });
  const { data: jobs, error: jobError } = await supabase.from("jobs").select("id,slug,title,company_name,location,work_mode,employment_type,salary_min,salary_max,salary_period,salary_type,published_at").eq("status", "published").gte("expires_at", new Date().toISOString().slice(0, 10));
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

    const items = matches.slice(0, 20).map((job) => `<li style="margin-bottom:16px"><a href="https://salarysabi.com/jobs/${encodeURIComponent(job.slug)}" style="font-weight:700;color:#075c46">${escapeHtml(job.title)}</a><br>${escapeHtml(job.company_name)} · ${escapeHtml(job.location)}<br>₦${Number(job.salary_min).toLocaleString()}–₦${Number(job.salary_max).toLocaleString()} ${escapeHtml(job.salary_type)} / ${escapeHtml(job.salary_period)}</li>`).join("");
    const unsubscribeUrl = `${supabaseUrl}/functions/v1/send-job-alerts?unsubscribe=${alert.unsubscribe_token}`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json", "Idempotency-Key": `alert-${alert.id}-${new Date().toISOString().slice(0, 10)}` },
      body: JSON.stringify({
        from: fromAddress,
        to: [user.email],
        subject: `${matches.length} new SalarySabi ${matches.length === 1 ? "job" : "jobs"} matching “${alert.keywords}”`,
        html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h1 style="color:#12352b">New jobs matching your alert</h1><p>You asked SalarySabi to watch for <strong>${escapeHtml(alert.keywords)}</strong>.</p><ul style="padding-left:20px">${items}</ul><p><a href="https://salarysabi.com/jobs">Search all jobs</a></p><hr><p style="font-size:12px;color:#66736e">You received this because you created a job alert. <a href="${unsubscribeUrl}">Unsubscribe from this alert</a>.</p></div>`,
      }),
    });
    if (!response.ok) continue;
    const result = await response.json();
    await supabase.from("job_notifications").insert(matches.slice(0, 20).map((job) => ({ alert_id: alert.id, job_id: job.id, provider_message_id: result.id })));
    await supabase.from("job_alerts").update({ last_sent_at: new Date().toISOString() }).eq("id", alert.id);
    sent += 1;
  }
  return Response.json({ alerts_processed: alerts?.length ?? 0, emails_sent: sent });
});
