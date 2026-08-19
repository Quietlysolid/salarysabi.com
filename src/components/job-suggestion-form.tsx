"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export function JobSuggestionForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [campaignReward, setCampaignReward] = useState(0);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  useEffect(() => { const requested = new URLSearchParams(window.location.search).get("campaign") || ""; if (requested) void supabase.rpc("public_active_contribution_campaigns").then(({ data }) => { const campaign = (data ?? []).find((item: { id: string; contribution_type: string }) => item.id === requested && item.contribution_type === "job_source"); if (campaign) { setCampaignId(campaign.id); setCampaignReward(Number(campaign.reward_kobo)); } }); }, [supabase]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    if (data.get("website")) return setMessage("Suggestion received.");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return setMessage("Suggestions are temporarily unavailable.");
    setBusy(true); setMessage("");
    try {
      const values = { p_official_url: String(data.get("official_url") || "").trim(), p_company_name: String(data.get("company_name") || "").trim(), p_advertised_salary: String(data.get("advertised_salary") || "").trim(), p_notes: String(data.get("notes") || "").trim() };
      const session = campaignId ? (await supabase.auth.getSession()).data.session : null;
      if (campaignId && !session) throw new Error("Sign in required");
      const response = campaignId ? await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/submit_rewarded_job_source`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ p_campaign_id: campaignId, ...values }) }) : await fetch(`${url.replace(/\/$/, "")}/rest/v1/job_suggestions`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ official_url: values.p_official_url, company_name: values.p_company_name, advertised_salary: values.p_advertised_salary, submitter_email: String(data.get("submitter_email") || "").trim().toLowerCase() || null, notes: values.p_notes }) });
      if (!response.ok) throw new Error("Suggestion failed");
      form.reset(); setMessage("Thanks. We’ll check the company page, salary and application link.");
    } catch { setMessage("We could not save this suggestion. Check the official link and try again."); }
    finally { setBusy(false); }
  }
  return <form className="job-submit-form job-suggestion-form" onSubmit={submit}>{campaignId&&<aside className="reward-campaign-note"><strong>Job scout campaign · {new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(campaignReward/100)} after approval</strong><span>Official, open and non-duplicated sources only. <Link href="/contributors">View programme rules</Link></span></aside>}<div className="job-form-grid">
    <label>Company name<input name="company_name" required maxLength={120} /></label>
    <label>Salary shown<input name="advertised_salary" required maxLength={160} placeholder="e.g. NGN 300,000–400,000 monthly" /></label>
    <label className="wide">Company job link<input name="official_url" type="url" required placeholder="https://company.com/careers/..." /></label>
    <label className="wide">Your email, optional<input name="submitter_email" type="email" /></label>
    <label className="wide">Anything we should check?<textarea name="notes" maxLength={1000} rows={4} /></label>
    <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
  </div><p className="job-form-note">Please send the company’s own job page.</p><button className="primary-button" disabled={busy}>{busy ? "Sending..." : "Send job"}</button><p role="status">{message}</p></form>;
}
