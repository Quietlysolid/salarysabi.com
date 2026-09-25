"use client";

import { useRef, useState, type FormEvent } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export function HiringAccount({ recovery = false, hasSession = false, onRecovered }: { recovery?: boolean; hasSession?: boolean; onRecovered: () => void }) {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const heading = recovery ? "Choose a new password" : mode === "signup" ? "Create your SalarySabi account" : mode === "reset" ? "Reset your password" : "Sign in to see your listings";

  function changeMode(next: typeof mode) { setMode(next); setMessage(""); setShowPassword(false); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") || "").trim();
    const password = String(values.get("password") || "");
    if (recovery && password !== values.get("confirmation")) { setMessage("The passwords do not match."); return; }
    pending.current = true; setBusy(true); setMessage("");
    try {
      if (recovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        onRecovered();
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/hiring?recovery=1` });
        if (error) throw error;
        setMessage("If an account exists for that email, a password reset link is on its way.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/hiring` } });
        if (error) throw error;
        setMessage("Check your email to confirm your account, then return here to manage your listings.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch {
      setMessage(recovery ? "We could not update your password. Request a new reset link and try again." : mode === "signin" ? "We could not sign you in. Check your email and password, or reset your password." : "We could not complete your request. Please try again shortly.");
    } finally { pending.current = false; setBusy(false); }
  }

  return <form className="hiring-sign-in" onSubmit={submit} aria-label={heading}>
    <h2>{heading}</h2>
    <p>{recovery ? "Use at least 8 characters." : mode === "signup" ? "Post jobs and track their review status with one account." : mode === "reset" ? "We’ll email you a link to choose a new password." : "Use the account you posted your jobs with."}</p>
    {recovery && !hasSession ? <><p role="alert">This reset link is unavailable or has expired. Request a new link.</p><button type="button" onClick={onRecovered}>Return to sign in</button></> : <>
      {!recovery && <label>Email<input name="email" type="email" autoComplete="email" required /></label>}
      {(recovery || mode !== "reset") && <>
        <label>{recovery ? "New password" : "Password"}<input name="password" type={showPassword ? "text" : "password"} autoComplete={recovery || mode === "signup" ? "new-password" : "current-password"} minLength={recovery || mode === "signup" ? 8 : undefined} aria-describedby={mode === "signup" ? "hiring-password-hint" : undefined} required /></label>
        {mode === "signup" && <small id="hiring-password-hint">Use at least 8 characters.</small>}
        <button className="hiring-auth-link" type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide password" : "Show password"}</button>
        {recovery && <label>Confirm new password<input name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required /></label>}
      </>}
      <button className="primary-button" type="submit" disabled={busy}>{busy ? "Please wait…" : recovery ? "Update password" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</button>
    </>}
    <p role="status">{message}</p>
    {!recovery && <nav className="hiring-auth-options" aria-label="Account options">
      {mode !== "signup" && <button className="hiring-auth-link" disabled={busy} type="button" onClick={() => changeMode("signup")}>Create an account</button>}
      {mode !== "signin" && <button className="hiring-auth-link" disabled={busy} type="button" onClick={() => changeMode("signin")}>Back to sign in</button>}
      {mode === "signin" && <button className="hiring-auth-link" disabled={busy} type="button" onClick={() => changeMode("reset")}>Forgot password?</button>}
    </nav>}
  </form>;
}
