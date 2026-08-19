"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export function JobActions({ jobId }: { jobId: string }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id ?? null;
      setUserId(id);
      if (!id) return;
      const [savedResult, appliedResult] = await Promise.all([
        supabase.from("saved_jobs").select("job_id").eq("job_id", jobId).maybeSingle(),
        supabase.from("job_applications").select("job_id").eq("job_id", jobId).maybeSingle(),
      ]);
      setSaved(Boolean(savedResult.data));
      setApplied(Boolean(appliedResult.data));
    });
  }, [jobId, supabase]);

  async function toggleSave() {
    if (!userId) return;
    const result = saved
      ? await supabase.from("saved_jobs").delete().eq("job_id", jobId)
      : await supabase.from("saved_jobs").insert({ user_id: userId, job_id: jobId });
    if (result.error) setMessage(result.error.message);
    else { setSaved(!saved); setMessage(saved ? "Removed from saved jobs." : "Job saved."); }
  }

  async function markApplied() {
    if (!userId) return;
    const { error } = await supabase.from("job_applications").upsert({ user_id: userId, job_id: jobId, status: "applied", applied_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    if (error) setMessage(error.message);
    else { setApplied(true); setMessage("Application recorded in your account."); }
  }

  async function report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const { error } = await supabase.from("job_reports").insert({ job_id: jobId, reason: data.get("reason"), details: String(data.get("details") || ""), reporter_email: String(data.get("email") || "") || null });
    if (error) setMessage(error.message);
    else { form.reset(); setMessage("Report received. We will review the listing."); }
  }

  return <section className="job-user-actions">
    <h2>Save this job</h2>
    {userId ? <JobAccountActionBar saved={saved} applied={applied} onToggleSave={() => { void toggleSave(); }} onMarkApplied={() => { void markApplied(); }} /> : <Link className="job-sign-in-action" href="/account">Sign in to save this job</Link>}
    <details className="job-report"><summary>Report a problem</summary><form onSubmit={report}><label>Problem<select name="reason"><option value="expired">Job is filled or expired</option><option value="broken_link">Application link is broken</option><option value="misleading">Details are misleading</option><option value="fee_requested">Someone requested a fee</option><option value="other">Another problem</option></select></label><label>Details<textarea name="details" maxLength={1000} rows={4} /></label><label>Email, optional<input name="email" type="email" /></label><button type="submit">Send report</button></form></details>
    <p role="status">{message}</p>
  </section>;
}

export function JobAccountActionBar({ saved, applied, onToggleSave, onMarkApplied }: { saved: boolean; applied: boolean; onToggleSave: () => void; onMarkApplied: () => void }) {
  return <div className="job-account-actions"><button type="button" onClick={onToggleSave}>{saved ? "Remove saved job" : "Save job"}</button><button type="button" onClick={onMarkApplied}>{applied ? "Application recorded" : "Mark as applied"}</button><Link href="/account">Open job workspace</Link></div>;
}
