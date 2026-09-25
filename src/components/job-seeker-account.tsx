"use client";

import { FormEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Bookmark, BriefcaseBusiness, LockKeyhole } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { ProductState } from "./product-state";
import { JobWorkspace, type ApplicationJobRow, type JobAlertRow, type SavedJobRow } from "./job-workspace";
import { track } from "./analytics";

export function JobSeekerAccount() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [saved, setSaved] = useState<SavedJobRow[]>([]);
  const [applications, setApplications] = useState<ApplicationJobRow[]>([]);
  const [alerts, setAlerts] = useState<JobAlertRow[]>([]);
  const [message, setMessage] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const activeUser = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (active) {
        setMessage("Account access is taking longer than expected. You can still sign in or browse jobs.");
        setSessionChecked(true);
      }
    }, 5000);
    supabase.auth.getSession()
      .then(({ data }) => { if (active) setSession(data.session); })
      .catch(() => { if (active) setMessage("We could not check your account session. You can still sign in below."); })
      .finally(() => { if (active) { window.clearTimeout(timeout); setSessionChecked(true); } });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      const userId = next?.user.id ?? null;
      if (activeUser.current !== userId) { setSaved([]); setApplications([]); setAlerts([]); setLoadError(false); }
      activeUser.current = userId;
      setSession(next); setSessionChecked(true);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });
    return () => { active = false; window.clearTimeout(timeout); data.subscription.unsubscribe(); };
  }, [supabase]);

  const load = useCallback(async () => {
    const userId = activeUser.current;
    if (!userId) return;
    const [savedResult, applicationResult, alertResult] = await Promise.all([
      supabase.from("saved_jobs").select("job_id,jobs(slug,title,company_name,expires_at)").order("created_at", { ascending: false }).abortSignal(AbortSignal.timeout(15000)),
      supabase.from("job_applications").select("job_id,status,jobs(slug,title,company_name)").order("updated_at", { ascending: false }).abortSignal(AbortSignal.timeout(15000)),
      supabase.from("job_alerts").select("id,keywords,location,work_mode,active").order("created_at", { ascending: false }).abortSignal(AbortSignal.timeout(15000)),
    ]);
    if (activeUser.current !== userId) return;
    if (savedResult.error || applicationResult.error || alertResult.error) { setLoadError(true); return; }
    setLoadError(false);
    setSaved((savedResult.data ?? []) as unknown as SavedJobRow[]);
    setApplications((applicationResult.data ?? []) as unknown as ApplicationJobRow[]);
    setAlerts(alertResult.data ?? []);
  }, [supabase]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (session) void load(); }, [load, session]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const credentials = { email: String(data.get("email")), password: String(data.get("password")) };
    if (authMode === "signup") track("account_signup_started");
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: `${window.location.origin}/account` } })
      : await supabase.auth.signInWithPassword(credentials);
    setMessage(result.error
      ? "We could not complete that request. Check your details and try again."
      : authMode === "signup" ? "Check your email to confirm your account." : "Signed in.");
    if (!result.error) track(authMode === "signup" ? "account_signup_succeeded" : "account_signin_succeeded");
  }

  async function resetPassword(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    const email = form ? String(new FormData(form).get("email") || "") : "";
    if (!email) { setMessage("Enter your email first, then choose Forgot password."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/account?recovery=1` });
    setMessage(error ? "We could not send the reset email. Try again shortly." : "Check your email for a password reset link.");
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    if (password !== data.get("confirmation")) { setMessage("The passwords do not match."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setMessage("We could not update your password. Request a new reset link and try again."); return; }
      setPasswordRecovery(false); setMessage("Password updated.");
      window.history.replaceState({}, "", "/account");
    } catch { setMessage("We could not update your password. Please try again."); }
    finally { setBusy(false); }
  }

  async function createAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!session || busy) return;
    const form = event.currentTarget; const data = new FormData(form); setBusy(true);
    try {
      const { error } = await supabase.from("job_alerts").insert({ user_id: session.user.id, email: session.user.email?.toLowerCase(), keywords: String(data.get("keywords") || "").trim(), location: String(data.get("location") || "").trim(), work_mode: data.get("work_mode"), consented_at: new Date().toISOString() });
      if (error) setMessage("We could not save your alert. Please try again.");
      else { form.reset(); setMessage("Job alert saved."); track("job_alert_created"); await load(); }
    } catch { setMessage("We could not confirm your alert was saved. Refresh your alerts before retrying."); }
    finally { setBusy(false); }
  }

  async function updateApplication(jobId: string, status: string) { const { error } = await supabase.from("job_applications").update({ status, updated_at: new Date().toISOString() }).eq("job_id", jobId); if (error) setMessage(error.message); else await load(); }
  async function removeSaved(jobId: string) { const { error } = await supabase.from("saved_jobs").delete().eq("job_id", jobId); if (error) setMessage(error.message); else await load(); }
  async function removeAlert(id: string) { const { error } = await supabase.from("job_alerts").delete().eq("id", id); if (error) setMessage(error.message); else await load(); }

  if (!sessionChecked) return <section className="account-loading"><ProductState kind="loading" title="Loading your job search" detail="Checking your private workspace and account session." /></section>;

  if (passwordRecovery && session) return <form className="account-access" onSubmit={updatePassword}><h1>Set a new password</h1><label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label><label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></label><button className="primary-button" disabled={busy} type="submit">Save new password</button><p role="status">{message}</p></form>;

  if (!session) return (
    <section className="account-gateway">
      <div className="account-preview">
        <h1>Save and track jobs.</h1>

        <div className="account-benefits" aria-label="What your account can do">
          <div><Bookmark aria-hidden="true" /><h2>Save jobs</h2></div>
          <div><BriefcaseBusiness aria-hidden="true" /><h2>Track applications</h2></div>
          <div><Bell aria-hidden="true" /><h2>Get job alerts</h2></div>
        </div>
      </div>

      <form className="account-access" onSubmit={authenticate}>
        <div className="account-mode" aria-label="Account access mode">
          <button aria-pressed={authMode === "signin"} className={authMode === "signin" ? "active" : ""} onClick={() => { setAuthMode("signin"); setMessage(""); }} type="button">Sign in</button>
          <button aria-pressed={authMode === "signup"} className={authMode === "signup" ? "active" : ""} onClick={() => { setAuthMode("signup"); setMessage(""); }} type="button">Create account</button>
        </div>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type={showPassword ? "text" : "password"} autoComplete={authMode === "signup" ? "new-password" : "current-password"} minLength={8} required /></label>
        <div className="account-password-actions">
          <label><input checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} type="checkbox" />Show password</label>
          {authMode === "signin" && <button onClick={resetPassword} type="button">Forgot password?</button>}
        </div>
        {authMode === "signup" && <p className="account-form-note">Use at least 8 characters. We’ll email you a confirmation link.</p>}
        <button className="primary-button account-submit" type="submit">{authMode === "signin" ? "Sign in" : "Create account"}</button>
        <p className="form-message" role="status">{message}</p>
        <Link className="account-browse-link" href="/jobs">Browse jobs</Link>
        <p className="account-privacy-note"><LockKeyhole aria-hidden="true" />Your saved activity is private.</p>
      </form>
    </section>
  );

  if (loadError) return <ProductState kind="error" title="Your job workspace could not be loaded" detail="Your saved jobs and alerts have not been removed." action={<button type="button" onClick={() => void load()}>Try again</button>} />;

  return <JobWorkspace onCreateAlert={createAlert} busy={busy} email={session.user.email ?? "Signed-in user"} saved={saved} applications={applications} alerts={alerts} message={message} onSignOut={() => { void supabase.auth.signOut(); }} onRemoveSaved={(jobId) => { void removeSaved(jobId); }} onUpdateApplication={(jobId, status) => { void updateApplication(jobId, status); }} onRemoveAlert={(id) => { void removeAlert(id); }} />;
}
