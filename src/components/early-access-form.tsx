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

    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          consent: data.get("consent") === "on",
          website: data.get("website"),
          elapsed: Date.now() - startedAt.current,
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Please try again.");
      form.reset();
      setState("success");
      setMessage("You’re on the list. We’ll email you when team payroll opens.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="email">Get one email when the payroll beta opens</label>
      <div>
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
        <span>I agree to receive this early-access email. Unsubscribe anytime.</span>
      </label>
      <label className="honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <small
        className={state === "error" ? "form-message error" : "form-message"}
        role="status"
      >
        {message || "No spam. Your address is used only for this launch update."}
      </small>
    </form>
  );
}
