"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, UsersRound } from "lucide-react";

export type SalaryRange = { role: string; industry: string; location: string; experience_band: string; sample_size: number; median_monthly_gross: number; low_monthly_gross: number; high_monthly_gross: number; period_start: string; period_end: string };
const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

export function SalaryCommunity({ initialRanges }: { initialRanges: SalaryRange[] | null }) {
  const [ranges, setRanges] = useState<SalaryRange[]>((initialRanges ?? []).filter(row => Number(row.sample_size) >= 5));
  const [status, setStatus] = useState<"loading" | "ready" | "error">(initialRanges === null ? "error" : "ready");
  const [query, setQuery] = useState("");
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const firstField = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const inFlight = useRef(false);
  const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const configured = Boolean(endpoint && key);

  useEffect(() => {
    if (reload === 0) return;
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => { if (active) { setStatus("error"); controller.abort(); } }, 10000);
    async function load() {
      if (!endpoint || !key) { window.clearTimeout(timeout); setStatus("error"); return; }
      setStatus("loading");
      try {
        const response = await fetch(`${endpoint}/rest/v1/rpc/public_recent_salary_benchmarks`, {
          method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: "{}", signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unavailable");
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid response");
        if (!controller.signal.aborted) { setRanges(data.filter((row: SalaryRange) => Number(row.sample_size) >= 5)); setStatus("ready"); }
      } catch { if (active) setStatus("error"); }
      finally { window.clearTimeout(timeout); }
    }
    void load();
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [endpoint, key, reload]);

  useEffect(() => { if (open) firstField.current?.focus(); }, [open]);
  const visible = useMemo(() => ranges.filter(row => `${row.role} ${row.industry} ${row.location}`.toLowerCase().includes(query.trim().toLowerCase())), [ranges, query]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !endpoint || !key) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      p_role: String(data.get("role") || "").trim(), p_industry: String(data.get("industry") || "").trim(), p_location: String(data.get("location") || "").trim(),
      p_observed_month: `${data.get("observed_month")}-01`, p_experience_band: data.get("experience"), p_company_size: data.get("size"), p_monthly_gross: Number(data.get("gross")), p_pay_reliability: data.get("reliability"),
    };
    if ([payload.p_role, payload.p_industry, payload.p_location].some(value => value.length < 2)) { setMessage("Enter a job title, industry and location with at least two characters each."); return; }
    inFlight.current = true; setBusy(true); setMessage("");
    try {
      const response = await fetch(`${endpoint}/rest/v1/rpc/submit_recent_salary_report`, {
        method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Not saved");
      form.reset(); setSubmitted(true); setMessage("Thank you. Your report is awaiting review. It will only appear in a group of at least five approved reports.");
    } catch { setMessage("We could not confirm your submission. Your entries are still here. Please try again later."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  function closeForm() { setOpen(false); toggle.current?.focus(); }

  return <div className="salary-community">
    <header className="community-heading">
      <span className="eyebrow">Salary community</span>
      <h1>Help build Nigeria&apos;s salary picture.</h1>
      <p>Share your salary privately to help others understand what their work could pay.</p>
      <div className="community-share-action">
        <button className="primary-button" ref={toggle} aria-expanded={open} aria-controls="community-share" onClick={() => { if (open) closeForm(); else setOpen(true); }} type="button">{open ? "Close form" : "Share my salary"}<ArrowRight aria-hidden="true" /></button>
        <small>No name or employer requested. Only grouped ranges are published.</small>
      </div>
    </header>

    <section className="community-ranges" aria-labelledby="community-ranges-title">
      <header className="community-explore-header"><div><h2 id="community-ranges-title">Community salary ranges</h2><p>Self-reported pay, not a verified market rate. Compare similar roles, experience and locations. Only pay from the last 12 calendar months is included. Exact duplicate reports count once.</p>{ranges.length > 0 && <p>Monthly gross pay in NGN, before tax and deductions.</p>}</div></header>
      {status === "ready" && ranges.length > 0 && <label className="community-search">Job title, industry or location<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="e.g. Product Designer or Lagos" /></label>}
      {status === "loading" && <div className="community-empty" role="status" aria-busy="true"><p>Loading salary ranges...</p></div>}
      {status === "error" && <div className="community-empty" role="status"><h3>We couldn&apos;t load salary ranges.</h3><p>Please try again. This doesn&apos;t mean there are no reports.</p><button className="secondary-button" type="button" onClick={() => setReload(value => value + 1)}>Try again</button></div>}
      {status === "ready" && !ranges.length && <div className="community-empty" role="status"><UsersRound aria-hidden="true" /><h3>No salary comparisons are available yet.</h3><p>Ranges appear once at least five similar reports have been reviewed. Your salary can help build the picture.</p></div>}
      {status === "ready" && ranges.length > 0 && <><div className="community-range-list">{visible.map(row => <article key={`${row.role}-${row.industry}-${row.location}-${row.experience_band}`}><h3>{row.role}</h3><p>{row.location} / {row.industry} / {row.experience_band} years</p><strong>{money.format(row.median_monthly_gross)}<small> median monthly pay</small></strong><p>Middle 50%: {money.format(row.low_monthly_gross)} to {money.format(row.high_monthly_gross)}</p><small>Based on {row.sample_size} reviewed reports. Salary months: {row.period_start?.slice(0, 7)} to {row.period_end?.slice(0, 7)}.</small></article>)}</div>{!visible.length && <div className="community-empty" role="status"><h3>No matching ranges yet.</h3><p>Try another job title, industry or location.</p><button className="secondary-button" type="button" onClick={() => setQuery("")}>Clear search</button></div>}<p className="community-note">These reports describe this community, not the whole job market.</p></>}
    </section>

    <nav className="connected-next" aria-label="Use salary knowledge"><Link href="/jobs">Find jobs with published pay</Link><Link href="/calculator">Estimate your take-home pay</Link></nav>
    {open && <section className="community-share" id="community-share" aria-labelledby="community-share-title">
      <h2 id="community-share-title">Share your salary privately</h2>
      <p>Use a general job title and city. Do not include your name, employer, email or other identifying details.</p>
      {!configured && <p role="status">Salary submissions are currently unavailable. You can review the form, but saving is disabled.</p>}
      {submitted ? <p role="status">{message}</p> : <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <legend>Your work and monthly pay</legend>
          <div className="community-fields"><label>Month this salary applied<input name="observed_month" type="month" max={new Date().toISOString().slice(0,7)} min={new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 11, 1)).toISOString().slice(0,7)} required /></label>
            <label>Job title<input ref={firstField} name="role" placeholder="e.g. Product Designer" minLength={2} maxLength={80} required /></label>
            <label>Industry<input name="industry" placeholder="e.g. Technology" minLength={2} maxLength={80} required /></label>
            <label>Work location<input name="location" placeholder="e.g. Lagos or Remote in Nigeria" minLength={2} maxLength={80} required /></label>
            <label>Years of experience<select name="experience" required defaultValue=""><option value="" disabled>Select experience</option><option value="0-2">0-2 years</option><option value="3-5">3-5 years</option><option value="6-9">6-9 years</option><option value="10+">10+ years</option></select></label>
            <label>Company size<select name="size" required defaultValue=""><option value="" disabled>Select company size</option><option value="1-10">1-10 people</option><option value="11-50">11-50 people</option><option value="51-200">51-200 people</option><option value="201+">201+ people</option></select></label>
            <label>Monthly gross salary (NGN)<input name="gross" type="number" inputMode="decimal" min="1000" max="100000000" step="0.01" placeholder="e.g. 500000" required /><small>Before tax and deductions.</small></label>
            <label>Are you usually paid on time?<select name="reliability" required defaultValue=""><option value="" disabled>Select payment pattern</option><option value="on-time">Usually on time</option><option value="sometimes-late">Sometimes late</option><option value="frequently-late">Often late</option></select></label>
          </div>
          <label className="community-consent"><input type="checkbox" required />I agree that my report may be reviewed and used in grouped salary statistics.</label>
          <div className="community-form-actions"><button className="primary-button" disabled={!configured} type="submit">{busy ? "Submitting..." : "Submit my salary"}</button><button type="button" className="secondary-button" onClick={closeForm}>Cancel</button><Link href="/privacy">How your information is handled</Link></div>
        </fieldset>
        <p role="status">{message}</p>
      </form>}
    </section>}

  </div>;
}
