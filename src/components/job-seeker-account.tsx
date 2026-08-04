"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type SavedRow = { job_id: string; jobs: { slug: string; title: string; company_name: string; expires_at: string } | null };
type ApplicationRow = { job_id: string; status: string; jobs: { slug: string; title: string; company_name: string } | null };
type AlertRow = { id: string; keywords: string; location: string; work_mode: string; active: boolean };

export function JobSeekerAccount() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next)); return () => data.subscription.unsubscribe(); }, [supabase]);
  const load = useCallback(async () => {
    const [savedResult, applicationResult, alertResult] = await Promise.all([
      supabase.from("saved_jobs").select("job_id,jobs(slug,title,company_name,expires_at)").order("created_at", { ascending: false }),
      supabase.from("job_applications").select("job_id,status,jobs(slug,title,company_name)").order("updated_at", { ascending: false }),
      supabase.from("job_alerts").select("id,keywords,location,work_mode,active").order("created_at", { ascending: false }),
    ]);
    setSaved((savedResult.data ?? []) as unknown as SavedRow[]); setApplications((applicationResult.data ?? []) as unknown as ApplicationRow[]); setAlerts(alertResult.data ?? []);
  }, [supabase]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (session) void load(); }, [load, session]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const mode = String(data.get("mode")) === "signup" ? "signup" : "signin"; const credentials = { email: String(data.get("email")), password: String(data.get("password")) };
    const result = mode === "signup" ? await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: `${window.location.origin}/account` } }) : await supabase.auth.signInWithPassword(credentials);
    setMessage(result.error ? result.error.message : mode === "signup" ? "Check your email to confirm your account." : "Signed in.");
  }

  async function updateApplication(jobId: string, status: string) { const { error } = await supabase.from("job_applications").update({ status, updated_at: new Date().toISOString() }).eq("job_id", jobId); if (error) setMessage(error.message); else await load(); }
  async function removeSaved(jobId: string) { const { error } = await supabase.from("saved_jobs").delete().eq("job_id", jobId); if (error) setMessage(error.message); else await load(); }
  async function removeAlert(id: string) { const { error } = await supabase.from("job_alerts").delete().eq("id", id); if (error) setMessage(error.message); else await load(); }

  if (!session) return <section className="account-auth"><div><span className="eyebrow">Job seeker account</span><h1>Keep your job search in one place.</h1><p>Save jobs, record applications and manage verified email alerts.</p></div><form onSubmit={authenticate}><label>Email<input name="email" type="email" required /></label><label>Password<input name="password" type="password" minLength={8} required /></label><div><button className="primary-button" name="mode" value="signin" type="submit">Sign in</button><button name="mode" value="signup" type="submit">Create account</button></div><p role="status">{message}</p></form></section>;

  return <section className="account-shell"><header><div><span className="eyebrow">My job search</span><h1>{session.user.email}</h1></div><button onClick={() => supabase.auth.signOut()}>Sign out</button></header><p role="status">{message}</p>
    <section><h2>Saved jobs</h2>{!saved.length && <p>No saved jobs yet.</p>}{saved.map((item) => item.jobs && <article className="account-row" key={item.job_id}><div><Link href={`/jobs/${item.jobs.slug}`}>{item.jobs.title}</Link><span>{item.jobs.company_name}</span></div><button onClick={() => removeSaved(item.job_id)}>Remove</button></article>)}</section>
    <section><h2>Applications</h2>{!applications.length && <p>No tracked applications yet.</p>}{applications.map((item) => item.jobs && <article className="account-row" key={item.job_id}><div><Link href={`/jobs/${item.jobs.slug}`}>{item.jobs.title}</Link><span>{item.jobs.company_name}</span></div><select value={item.status} onChange={(event) => updateApplication(item.job_id, event.target.value)}><option value="applied">Applied</option><option value="interviewing">Interviewing</option><option value="offered">Offer received</option><option value="rejected">Not selected</option><option value="withdrawn">Withdrawn</option></select></article>)}</section>
    <section><h2>Job alerts</h2>{!alerts.length && <p>No alerts yet. Create one on the jobs page.</p>}{alerts.map((item) => <article className="account-row" key={item.id}><div><strong>{item.keywords}</strong><span>{item.location || "Any location"} · {item.work_mode} · {item.active ? "Active" : "Unsubscribed"}</span></div><button onClick={() => removeAlert(item.id)}>Delete</button></article>)}</section>
  </section>;
}
