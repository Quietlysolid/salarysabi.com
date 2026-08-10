"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { track } from "./analytics";

export function JobAlertForm() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    setMessage("");
    setStatus("idle");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const user = authData.user;
      if (authError || !user) {
        setMessage("Sign in or create an account before creating an alert.");
        setStatus("error");
        return;
      }
      if (!user.email || !user.email_confirmed_at) {
        setMessage("Confirm your email address before creating an alert.");
        setStatus("error");
        return;
      }
      const { error } = await supabase.from("job_alerts").insert({
        user_id: user.id,
        email: user.email,
        keywords: String(data.get("keywords") || "").trim(),
        location: String(data.get("location") || "").trim(),
        work_mode: data.get("work_mode"),
        consented_at: new Date().toISOString(),
        verified_at: user.email_confirmed_at,
      });
      if (error) throw error;
      form.reset();
      setMessage("Alert saved. Matching jobs will be sent to your verified email address.");
      setStatus("success");
      track("job_alert_created");
    } catch {
      setMessage("We could not create the alert. Please try again.");
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="job-alert" onSubmit={submit}>
      <div><strong>What job do you want?</strong><span>We’ll email you when there is a match.</span></div>
      <input name="keywords" aria-label="Job title or skill" placeholder="Job title or skill" maxLength={100} required />
      <input name="location" aria-label="Location" placeholder="Location, e.g. Lagos" maxLength={100} />
      <select name="work_mode" aria-label="Where you want to work"><option value="all">Anywhere</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select>
      <label className="alert-consent"><input type="checkbox" required /><span>Send matching jobs to my email.</span></label>
      <button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Send me jobs"}</button>
      <small>You need an account for job alerts. <Link href="/account">Sign in or create one</Link>.</small>
      <small className={`form-message ${status}`} role="status">{message}</small>
    </form>
  );
}
