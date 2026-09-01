"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

const campaignSlug = "transparent-jobs-pilot-2026";

type PublicCampaign = {
  id: string;
  slug: string;
  contribution_type: string;
  title: string;
  description: string;
  eligibility_note: string;
  target_approved: number;
  approved_count: number;
  reward_kobo: number;
  budget_remaining_kobo: number;
  ends_at: string;
};

const money = (kobo: number) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
}).format(kobo / 100);

export function JobScoutProgram() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [status, setStatus] = useState<"loading" | "active" | "inactive" | "error">("loading");

  useEffect(() => {
    void supabase.rpc("public_active_contribution_campaigns").then(({ data, error }) => {
      if (error) {
        setStatus("error");
        return;
      }
      const activeCampaign = ((data ?? []) as PublicCampaign[]).find((item) => item.slug === campaignSlug && item.contribution_type === "job_source") ?? null;
      setCampaign(activeCampaign);
      setStatus(activeCampaign ? "active" : "inactive");
    });
  }, [supabase]);

  const remainingRewards = campaign && campaign.reward_kobo > 0
    ? Math.floor(campaign.budget_remaining_kobo / campaign.reward_kobo)
    : 0;

  return <div className="contributor-page job-sourcing-page">
    <header className="contributor-hero">
      <span className="eyebrow">Transparent jobs scout</span>
      <h1>{campaign ? `Find a salary-transparent job. Earn ${money(campaign.reward_kobo)}.` : "Help uncover salary-transparent Nigerian jobs."}</h1>
      <p>Send an official, active Nigerian vacancy where the employer already shows the offered salary. SalarySabi independently checks every source before approving a reward.</p>
      {status === "loading" && <p className="contributor-campaign-state" role="status">Checking whether the paid pilot is open…</p>}
      {status === "active" && campaign && <div className="contributor-hero-actions">
        <Link className="primary-button" href={`/suggest-a-job?campaign=${campaign.slug}`}>Submit a salary-transparent job</Link>
        <span>{remainingRewards} funded {remainingRewards === 1 ? "reward" : "rewards"} remaining</span>
      </div>}
      {status === "inactive" && <div className="contributor-campaign-state" role="status"><strong>Paid submissions are not open right now.</strong><span>You can still send an unpaid job tip for SalarySabi to review.</span><Link href="/suggest-a-job">Share an unpaid job tip</Link></div>}
      {status === "error" && <div className="contributor-campaign-state is-error" role="status"><strong>Campaign status is temporarily unavailable.</strong><span>No reward can be promised until the status is confirmed.</span></div>}
      <Link className="contributor-dashboard-link" href="/contributions">Track my submissions and rewards</Link>
    </header>

    <section className="contributor-reward-model">
      <header><span className="eyebrow">How approval works</span><h2>One source, three clear steps.</h2></header>
      <ol>
        <li><strong>01</strong><div><span>Submit the official vacancy</span><small>Include the employer page, company name and the exact salary shown.</small></div></li>
        <li><strong>02</strong><div><span>SalarySabi verifies it</span><small>We confirm the application is open, Nigeria-relevant, salary-bearing and not duplicated.</small></div></li>
        <li><strong>03</strong><div><span>Your reward is approved</span><small>The reward enters your contributor balance after all checks pass.</small></div></li>
      </ol>
    </section>

    <section className="job-scout-rules" aria-labelledby="job-scout-rules-title">
      <div><span className="eyebrow">Eligibility</span><h2 id="job-scout-rules-title">What qualifies</h2></div>
      <ul>
        <li><strong>Official source</strong><span>An employer careers page, its ATS page, or another employer-controlled vacancy page.</span></li>
        <li><strong>Open application</strong><span>The original page must still accept applications when SalarySabi reviews it.</span></li>
        <li><strong>Nigeria-relevant</strong><span>The location or eligibility must explicitly include Nigeria.</span></li>
        <li><strong>Offered pay is visible</strong><span>A numerical amount or range, currency, and monthly or annual pay period must be stated.</span></li>
      </ul>
      <aside><strong>These do not qualify:</strong><span>Salary estimates, employee reports, “competitive salary,” expected-salary questions, expired jobs, duplicate listings, or amounts converted by the contributor.</span></aside>
    </section>

    <aside className="job-scout-boundary">
      <strong>A submission is not an automatic approval.</strong>
      <span>A pending claim reserves campaign budget, but the reward is earned only after independent source verification. Rejected claims release the reservation.</span>
      <Link href="/contributors">Looking for the anonymous salary-report programme?</Link>
    </aside>
  </div>;
}
