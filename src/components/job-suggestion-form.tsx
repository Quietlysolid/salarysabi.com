"use client";

import Link from "next/link";
import { Banknote, Building2, Link2, Mail, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { track } from "@/components/analytics";
import { contributorDeviceId, TurnstileCheck } from "@/components/turnstile-check";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Campaign = {
  id: string;
  slug: string;
  contribution_type: string;
  reward_kobo: number;
  budget_remaining_kobo: number;
  ends_at: string;
};

const money = (kobo: number) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
}).format(kobo / 100);

export function JobSuggestionForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [campaignRequested, setCampaignRequested] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<"none" | "loading" | "active" | "unavailable">("none");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [rewardEmail, setRewardEmail] = useState("");
  const [rewardSubmitted, setRewardSubmitted] = useState(false);
  const [humanToken, setHumanToken] = useState("");
  const [humanReset, setHumanReset] = useState(0);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const receiveHumanToken = useCallback((token: string) => setHumanToken(token), []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    const timer = window.setTimeout(() => {
      const requested = new URLSearchParams(window.location.search).get("campaign")?.trim() ?? "";
      if (!requested) return;
      setCampaignRequested(true);
      setCampaignStatus("loading");
      void Promise.all([
        supabase.rpc("public_active_contribution_campaigns"),
        supabase.auth.getSession(),
      ]).then(([campaignResult, sessionResult]) => {
        const match = ((campaignResult.data ?? []) as Campaign[]).find((item) =>
          item.contribution_type === "job_source" && (item.slug === requested || item.id === requested),
        ) ?? null;
        setCampaign(match);
        setCampaignStatus(match ? "active" : "unavailable");
        setSession(sessionResult.data.session);
      });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function sendRewardSignIn() {
    const email = rewardEmail.trim().toLowerCase();
    if (!email) {
      setMessage("Enter your email to receive a secure sign-in link.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    setMessage(error ? error.message : "Check your email and open the secure SalarySabi sign-in link.");
    setBusy(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("website")) {
      setMessage("Suggestion received.");
      return;
    }
    if (campaignRequested && campaignStatus !== "active") {
      setMessage("This paid campaign is not accepting submissions. No reward claim was created.");
      return;
    }
    if (campaign && !session) {
      setMessage("Use the secure email sign-in before submitting a rewarded job source.");
      return;
    }
    if (campaign && !humanToken) {
      setMessage("Complete the human verification before submitting.");
      return;
    }

    const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!endpoint || !key) {
      setMessage("Suggestions are temporarily unavailable.");
      return;
    }

    setBusy(true);
    setMessage("");
    setRewardSubmitted(false);
    if (campaign) track("reward_submission_started");
    try {
      const values = {
        p_official_url: String(data.get("official_url") || "").trim(),
        p_company_name: String(data.get("company_name") || "").trim(),
        p_advertised_salary: String(data.get("advertised_salary") || "").trim(),
        p_notes: String(data.get("notes") || "").trim(),
      };
      const response = campaign
        ? await fetch(`${endpoint.replace(/\/$/, "")}/functions/v1/submit-rewarded-contribution`, {
            method: "POST",
            headers: {
              apikey: key,
              Authorization: `Bearer ${session?.access_token}`,
              "Content-Type": "application/json",
              "x-salarysabi-device": contributorDeviceId(),
            },
            body: JSON.stringify({
              type: "job_source",
              campaignId: campaign.id,
              turnstileToken: humanToken,
              payload: { officialUrl: values.p_official_url, companyName: values.p_company_name, advertisedSalary: values.p_advertised_salary, notes: values.p_notes },
            }),
          })
        : await fetch(`${endpoint.replace(/\/$/, "")}/rest/v1/job_suggestions`, {
            method: "POST",
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              official_url: values.p_official_url,
              company_name: values.p_company_name,
              advertised_salary: values.p_advertised_salary,
              submitter_email: String(data.get("submitter_email") || "").trim().toLowerCase() || null,
              notes: values.p_notes,
            }),
          });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null) as { error?: string; message?: string } | null;
        throw new Error(errorBody?.error || errorBody?.message || "The suggestion could not be saved.");
      }
      form.reset();
      setHumanToken("");
      setHumanReset((value) => value + 1);
      setRewardSubmitted(Boolean(campaign));
      setMessage(campaign
        ? `${money(campaign.reward_kobo)} is reserved from the campaign budget while SalarySabi verifies your source.`
        : "Thanks. We’ll check the company page, salary and application link.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not save this suggestion. Check the official link and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (campaignRequested && campaignStatus === "loading") {
    return <section className="campaign-form-state" role="status"><strong>Checking the paid campaign…</strong><span>The form will open only if rewards are currently available.</span></section>;
  }

  if (campaignRequested && campaignStatus === "unavailable") {
    return <section className="campaign-form-state is-warning" role="status">
      <strong>This paid campaign is not accepting submissions.</strong>
      <span>No reward will be promised or reserved from this link.</span>
      <Link href="/suggest-a-job">Continue with an unpaid job tip</Link>
    </section>;
  }

  if (campaign && !session) {
    return <section className="campaign-form-state reward-access-card">
      <span className="eyebrow">Secure reward access</span>
      <h2>Sign in before you submit.</h2>
      <p>Your email gives you access to the reward claim and payout. It is not displayed with the public job listing.</p>
      <label>Email address<input autoComplete="email" onChange={(event) => setRewardEmail(event.target.value)} placeholder="you@example.com" type="email" value={rewardEmail} /></label>
      <button className="primary-button" disabled={busy} onClick={() => void sendRewardSignIn()} type="button">{busy ? "Sending…" : "Email me a secure sign-in link"}</button>
      <p role="status">{message}</p>
    </section>;
  }

  return <form className="job-submit-form job-suggestion-form" onSubmit={submit}>
    {campaign && <aside className="reward-campaign-note">
      <strong>Job scout campaign · {money(campaign.reward_kobo)} after approval</strong>
      <span>The budget is reserved when you submit. The reward is approved only after all source checks pass. <Link href="/contributors/job-sourcing">View the rules</Link></span>
    </aside>}
    <header className="job-suggestion-form-heading">
      <span className="eyebrow">Independent source review</span>
      <h2>Share the original vacancy</h2>
      <p>Copy the details exactly as the employer published them. SalarySabi checks the source before the role appears publicly.</p>
    </header>

    <section className="job-suggestion-form-section" aria-labelledby="vacancy-details-heading">
      <header>
        <span aria-hidden="true">01</span>
        <div>
          <h3 id="vacancy-details-heading">Vacancy details</h3>
          <p>Use the employer’s wording so the listing is easy to verify.</p>
        </div>
      </header>
      <div className="job-form-grid">
        <label>
          <span className="job-field-label"><Building2 aria-hidden="true" size={18} />Company name</span>
          <input autoComplete="organization" name="company_name" required maxLength={120} placeholder="e.g. Paystack" />
          <small>Enter the name shown on the vacancy.</small>
        </label>
        <label>
          <span className="job-field-label"><Banknote aria-hidden="true" size={18} />Salary exactly as shown</span>
          <input name="advertised_salary" required maxLength={160} placeholder="e.g. ₦300,000–₦400,000 per month" />
          <small>Keep the currency, range and pay period unchanged.</small>
        </label>
        <label className="wide">
          <span className="job-field-label"><Link2 aria-hidden="true" size={18} />Official vacancy URL</span>
          <input autoComplete="url" name="official_url" type="url" required placeholder="https://company.com/careers/job…" />
          <small>Link to the employer’s original careers page or official application page.</small>
        </label>
      </div>
    </section>

    <section className="job-suggestion-form-section" aria-labelledby="review-context-heading">
      <header>
        <span aria-hidden="true">02</span>
        <div>
          <h3 id="review-context-heading">Review context</h3>
          <p>Add anything that will help us find and confirm the salary quickly.</p>
        </div>
      </header>
      <div className="job-form-grid">
        {!campaign && <label className="wide">
          <span className="job-field-label"><Mail aria-hidden="true" size={18} />Your email <em>Optional</em></span>
          <input autoComplete="email" name="submitter_email" type="email" placeholder="you@example.com" />
          <small>Only used if we need to clarify the source. It is never shown on the listing.</small>
        </label>}
        <label className="wide">
          <span className="job-field-label"><MessageSquareText aria-hidden="true" size={18} />Anything we should check?</span>
          <textarea name="notes" maxLength={1000} rows={4} placeholder="Job title, location, deadline, or where the salary appears on the page" />
        </label>
      </div>
    </section>

    <section className="job-source-confirmation" aria-labelledby="source-confirmation-heading">
      <ShieldCheck aria-hidden="true" size={24} strokeWidth={2} />
      <label>
        <input name="source_confirmed" required type="checkbox" />
        <span><strong id="source-confirmation-heading">Confirm the source</strong>I opened the original vacancy and confirmed it is active, Nigeria-relevant, and shows this offered salary. I did not estimate or convert the amount.</span>
      </label>
    </section>
    <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    {campaign && <TurnstileCheck action="reward_job" onToken={receiveHumanToken} resetSignal={humanReset} />}
    <footer className="job-suggestion-submit">
      <div><strong>What happens next?</strong><span>We verify the company, vacancy and published salary before listing it.</span></div>
      <button className="primary-button" disabled={busy || Boolean(campaign && !humanToken)} type="submit">
        <Send aria-hidden="true" size={18} strokeWidth={2.25} />
        {busy ? "Submitting…" : campaign ? "Verify source and submit" : "Send job tip"}
      </button>
    </footer>
    <p className="job-suggestion-status" role="status">{message}</p>
    {rewardSubmitted && <Link className="submission-tracking-link" href="/contributions">Track this contribution and reward</Link>}
  </form>;
}
