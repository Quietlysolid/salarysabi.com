"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@/components/analytics";
import { ContributorShare } from "@/components/contributor-share";
import { useActiveContributionCampaigns, type ActiveContributionCampaign as Campaign } from "@/lib/active-contribution-campaigns";

const money = (kobo: number) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
}).format(kobo / 100);

function remainingRewards(campaign: Campaign) {
  return Math.floor(campaign.budget_remaining_kobo / campaign.reward_kobo);
}

function campaignEnd(campaign: Campaign) {
  return new Date(campaign.ends_at).toLocaleDateString("en-NG", { dateStyle: "medium" });
}

export function ContributorProgram() {
  const [rulesOpen, setRulesOpen] = useState(false);
  const { campaigns, status } = useActiveContributionCampaigns();

  useEffect(() => {
    if (campaigns.length > 0) track("reward_offer_viewed");
  }, [campaigns.length]);

  const salaryCampaign = campaigns.find((campaign) => campaign.contribution_type === "salary_report") ?? null;
  const jobCampaign = campaigns.find((campaign) => campaign.contribution_type === "job_source") ?? null;
  const sharedReward = campaigns.length > 0 && campaigns.every((campaign) => campaign.reward_kobo === campaigns[0].reward_kobo)
    ? money(campaigns[0].reward_kobo)
    : null;

  function showEligibility() {
    track("reward_offer_clicked");
    setRulesOpen(true);
    window.setTimeout(() => document.getElementById("pilot-rules")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  return <div className="contributor-page salary-reward-page simplified-reward-page">
    <header className="contributor-hero contributor-programme-hero">
      <span className="eyebrow">Funded contributor programme</span>
      <h1>Help make Nigerian pay transparent.</h1>
      <p>{sharedReward ? `Funded offers currently pay ${sharedReward} after approval. ` : "When funded offers are open, rewards are paid only after approval. "}Choose a live offer, submit genuine information and track every review decision.</p>
      <Link className="contributor-dashboard-link" href="/contributions">View my contributions and rewards</Link>
    </header>

    {status === "loading" && <div className="contributor-offer-state" role="status">Checking which funded offers are open…</div>}
    {status === "error" && <div className="contributor-offer-state is-error" role="status"><strong>We could not confirm the live offers.</strong><span>Refresh this page before submitting so you never rely on an unavailable reward.</span></div>}
    {status === "ready" && campaigns.length === 0 && <div className="contributor-offer-state"><strong>No funded offers are open right now.</strong><span>You can still share salary information without a reward from the salary benchmarks page.</span><Link href="/salaries#salary-report">Share without a reward</Link></div>}

    {campaigns.length > 0 && <section className="contributor-offer-grid" aria-label="Choose a funded offer">
      {salaryCampaign && <article>
        <div>
          <span className="eyebrow">Salary report</span>
          <h2>Share your own salary</h2>
          <p>Your individual salary stays out of public view. It only contributes to a benchmark after five similar reports are approved.</p>
        </div>
        <div className="contributor-offer-reward">
          <strong>{money(salaryCampaign.reward_kobo)}</strong><span>after approval</span>
          <small>{remainingRewards(salaryCampaign)} funded rewards remain · Ends {campaignEnd(salaryCampaign)}</small>
        </div>
        <button className="primary-button" onClick={showEligibility} type="button">Check salary-report eligibility</button>
      </article>}

      {jobCampaign && <article>
        <div>
          <span className="eyebrow">Verified job lead</span>
          <h2>Find a job with published pay</h2>
          <p>Send an open Nigerian vacancy from an official employer page where the offered salary and pay period are visible.</p>
        </div>
        <div className="contributor-offer-reward">
          <strong>{money(jobCampaign.reward_kobo)}</strong><span>after approval</span>
          <small>{remainingRewards(jobCampaign)} funded rewards remain · Ends {campaignEnd(jobCampaign)}</small>
        </div>
        <Link className="primary-button" href="/contributors/job-sourcing" onClick={() => track("reward_offer_clicked")}>Check job-lead requirements</Link>
      </article>}
    </section>}

    {campaigns.length > 0 && <ContributorShare />}

    <section className="contributor-rules" aria-label="How it works">
      <article><span>01</span><h2>Choose an offer</h2></article>
      <article><span>02</span><h2>Submit evidence</h2></article>
      <article><span>03</span><h2>Pass review</h2></article>
    </section>

    {salaryCampaign && <details className="reward-rules-disclosure" id="pilot-rules" open={rulesOpen} onToggle={(event) => setRulesOpen(event.currentTarget.open)}>
      <summary>Salary-report eligibility and approval rules <span aria-hidden="true">+</span></summary>
      <div>
        <ul>
          <li>The salary must be your own current or recent Nigerian employment income.</li>
          <li>Required answers must be complete and internally plausible.</li>
          <li>Duplicate, fabricated or identifying submissions are rejected.</li>
          <li>Only one paid salary report is allowed per person during this pilot.</li>
          <li>Your individual salary is never published. A benchmark needs five similar approved reports.</li>
        </ul>
        <Link className="primary-button reward-rules-cta" href={`/salaries?campaign=${salaryCampaign.slug}#salary-report`} onClick={() => track("reward_offer_clicked")}>Share my salary</Link>
      </div>
    </details>}
  </div>;
}
