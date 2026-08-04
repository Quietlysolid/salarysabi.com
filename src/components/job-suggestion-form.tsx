"use client";

import { FormEvent, useState } from "react";

export function JobSuggestionForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    if (data.get("website")) return setMessage("Suggestion received.");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return setMessage("Suggestions are temporarily unavailable.");
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/job_suggestions`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ official_url: String(data.get("official_url") || "").trim(), company_name: String(data.get("company_name") || "").trim(), advertised_salary: String(data.get("advertised_salary") || "").trim(), submitter_email: String(data.get("submitter_email") || "").trim().toLowerCase() || null, notes: String(data.get("notes") || "").trim() }) });
      if (!response.ok) throw new Error("Suggestion failed");
      form.reset(); setMessage("Thank you. We will check the official page, salary and application route before publishing anything.");
    } catch { setMessage("We could not save this suggestion. Check the official link and try again."); }
    finally { setBusy(false); }
  }
  return <form className="job-submit-form job-suggestion-form" onSubmit={submit}><div className="job-form-grid">
    <label>Company name<input name="company_name" required maxLength={120} /></label>
    <label>Salary shown in the advert<input name="advertised_salary" required maxLength={160} placeholder="e.g. NGN 300,000–400,000 monthly" /></label>
    <label className="wide">Official employer job link<input name="official_url" type="url" required placeholder="https://company.com/careers/..." /></label>
    <label className="wide">Your email, optional<input name="submitter_email" type="email" /></label>
    <label className="wide">Anything we should check?<textarea name="notes" maxLength={1000} rows={4} /></label>
    <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
  </div><p className="job-form-note">Send the employer’s official page, not a copied description or social-media search page.</p><button className="primary-button" disabled={busy}>{busy ? "Sending..." : "Suggest job for review"}</button><p role="status">{message}</p></form>;
}
