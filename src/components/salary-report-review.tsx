"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Report = { id: string; role: string; industry: string; location: string; experience_band: string; monthly_gross: number; observed_month: string | null };
export function SalaryReportReview() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState("Loading reports...");
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void supabase.from("salary_reports").select("id,role,industry,location,experience_band,monthly_gross,observed_month").eq("publication_status", "pending").order("created_at").limit(100).then(({ data, error }) => {
      if (!active) return;
      if (error) { setMessage("Reports could not be loaded. Try again."); return; }
      setReports(data ?? []); setMessage(data?.length ? "" : "No reports awaiting review.");
    });
    return () => { active = false; };
  }, [supabase, reload]);
  async function review(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget; const data = new FormData(form); setBusy(true);
    try {
      const { error } = await supabase.rpc("review_community_salary_report", { p_report_id: id, p_publish: data.get("decision") === "publish", p_note: data.get("note"), p_checks_confirmed: data.get("checks") === "on" });
      if (error) setMessage("Could not save the decision. Confirm the checks and note, then try again.");
      else { setReports(current => current.filter(report => report.id !== id)); setMessage("Review saved. Approved reports appear only in eligible groups of at least five."); }
    } finally { setBusy(false); }
  }
  return <section className="salary-report-review"><h1>Salary reports</h1><p>Review self-reported pay before it contributes to grouped comparisons.</p><p role="status">{message}</p><button type="button" onClick={() => setReload(value => value + 1)}>Refresh reports</button>{reports.map(report => <article key={report.id}>
    <h2>{report.role}</h2><p>{report.industry} / {report.location} / {report.experience_band} years</p><p>{new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(report.monthly_gross)} monthly gross · {report.observed_month?.slice(0, 7) || "Undated: excluded from recent comparisons"}</p>
    <form onSubmit={event => void review(event, report.id)}><fieldset disabled={busy}><label>Decision<select name="decision"><option value="publish">Approve for grouped comparisons</option><option value="suppress">Exclude report</option></select></label><label><input type="checkbox" name="checks" />Checked for identifying details, implausible figures and duplicate reports.</label><label>Review note<textarea name="note" minLength={5} maxLength={1000} required /></label><button type="submit">Save decision</button></fieldset></form>
  </article>)}</section>;
}
