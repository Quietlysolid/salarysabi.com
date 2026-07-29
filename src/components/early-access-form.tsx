"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

export function EarlyAccessForm() {
  const startedAt = useRef(0);
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    try {
      if (!url || !key) {
        throw new Error(
          "Early access is being connected. Please try again shortly.",
        );
      }
      if (data.get("website")) {
        setState("success");
        return;
      }
      if (Date.now() - startedAt.current < 1200) {
        throw new Error("Please wait a moment and try again.");
      }

      const response = await fetch(
        `${url.replace(/\/$/, "")}/rest/v1/early_access_signups`,
        {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          email: String(data.get("email") || "").trim().toLowerCase(),
          consented_at: new Date().toISOString(),
          source: "homepage",
        }),
      },
      );
      if (!response.ok && response.status !== 409) {
        throw new Error("We could not save your email. Please try again.");
      }
      form.reset();
      setState("success");
      setMessage("You’re on the list. We’ll email you when team payroll opens.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  }

  return (
    <form className="early-access-form" onSubmit={submit}>
      <label className="email-label" htmlFor="email">
        Get one email when the payroll beta opens
      </label>
      <div className="email-row">
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@business.com"
          autoComplete="email"
          required
        />
        <button disabled={state === "submitting"} type="submit">
          {state === "submitting" ? "Joining…" : "Join the list"}
        </button>
      </div>
      <label className="consent-row">
        <input name="consent" type="checkbox" required />
        <span className="consent-copy">
          <span>I agree to receive one early-access email.</span>
          <small>No spam. Unsubscribe anytime.</small>
        </span>
      </label>
      <label className="honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <small
        className={state === "error" ? "form-message error" : "form-message"}
        role="status"
      >
        {message}
      </small>
    </form>
  );
}
