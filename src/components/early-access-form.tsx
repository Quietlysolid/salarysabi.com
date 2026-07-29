"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { track } from "@/components/analytics";
import type { AnalyticsEvent } from "@/lib/launch";

type FormState = "idle" | "submitting" | "success" | "error";
type SignupSource = "payslip_checker" | "employer_payroll";

const eventNames: Record<
  SignupSource,
  { viewed: AnalyticsEvent; submitted: AnalyticsEvent; succeeded: AnalyticsEvent }
> = {
  payslip_checker: {
    viewed: "payslip_signup_viewed",
    submitted: "payslip_signup_submitted",
    succeeded: "payslip_signup_succeeded",
  },
  employer_payroll: {
    viewed: "payroll_signup_viewed",
    submitted: "payroll_signup_submitted",
    succeeded: "payroll_signup_succeeded",
  },
};

export function EarlyAccessForm({
  source,
  idPrefix,
  label,
  placeholder,
  buttonText = "Join the list",
  successMessage,
}: {
  source: SignupSource;
  idPrefix: string;
  label: string;
  placeholder: string;
  buttonText?: string;
  successMessage: string;
}) {
  const startedAt = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    startedAt.current = Date.now();
    const form = formRef.current;
    if (!form) return;

    let recorded = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !recorded) {
          recorded = true;
          track(eventNames[source].viewed);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(form);
    return () => observer.disconnect();
  }, [source]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    track(eventNames[source].submitted);

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
            source,
          }),
        },
      );
      if (!response.ok && response.status !== 409) {
        throw new Error("We could not save your email. Please try again.");
      }

      form.reset();
      setState("success");
      setMessage(successMessage);
      track(eventNames[source].succeeded);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  }

  return (
    <form className="early-access-form" ref={formRef} onSubmit={submit}>
      <label className="email-label" htmlFor={`${idPrefix}-email`}>
        {label}
      </label>
      <div className="email-row">
        <input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          placeholder={placeholder}
          autoComplete="email"
          required
        />
        <button disabled={state === "submitting"} type="submit">
          {state === "submitting" ? "Joining..." : buttonText}
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
