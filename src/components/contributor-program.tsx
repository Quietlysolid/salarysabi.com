"use client";

import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  FilePlus2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
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

const journey = [
  { title: "Submit privately", detail: "Only you and SalarySabi see your details.", icon: FilePlus2 },
  { title: "We verify", detail: "We check the evidence and confirm it.", icon: ShieldCheck },
  { title: "We publish safely", detail: "Approved data joins an anonymous benchmark.", icon: BarChart3 },
  { title: "You earn a reward", detail: "Payment follows an approved report.", icon: WalletCards },
] as const;

export function ContributorProgram() {
  const { campaigns, status } = useActiveContributionCampaigns();

  useEffect(() => {
    if (campaigns.length > 0) track("reward_offer_viewed");
  }, [campaigns.length]);

  const salaryCampaign = campaigns.find((campaign) => campaign.contribution_type === "salary_report") ?? null;
  const jobCampaign = campaigns.find((campaign) => campaign.contribution_type === "job_source") ?? null;

  return <div className="contributor-page contributor-outcome-page">
    <section className="contributor-outcome-hero" aria-labelledby="contributor-outcome-title">
      <div className="contributor-outcome-pitch">
        <span className="eyebrow">Funded contributor programme</span>
        <h1 id="contributor-outcome-title">Your evidence makes pay visible.</h1>
        <p>Share your salary or a paid job. SalarySabi verifies it, publishes it safely and rewards approved evidence.</p>

        {salaryCampaign && <div className="contributor-outcome-reward" aria-label={`${money(salaryCampaign.reward_kobo)} after approval`}>
          <strong>{money(salaryCampaign.reward_kobo)}</strong>
          <span>after approval</span>
          <small>{remainingRewards(salaryCampaign)} funded rewards remain</small>
        </div>}

        {status === "loading" && <p className="contributor-outcome-status" role="status">Checking which funded offers are open…</p>}
        {status === "error" && <p className="contributor-outcome-status is-error" role="status">We could not confirm the live offers. Refresh before submitting.</p>}
        {status === "ready" && campaigns.length === 0 && <div className="contributor-outcome-status" role="status">
          <strong>No funded offers are open right now.</strong>
          <Link href="/salaries#salary-report">Share salary information without a reward</Link>
        </div>}

        {salaryCampaign && <Link
          className="contributor-outcome-primary"
          href={`/salaries?campaign=${salaryCampaign.slug}#salary-report`}
          onClick={() => track("reward_offer_clicked")}
        >
          <FilePlus2 aria-hidden="true" />
          Share my salary
          <ArrowRight aria-hidden="true" />
        </Link>}
      </div>

      <div className="contributor-outcome-proof">
        <span className="eyebrow">How your pay contribution becomes useful</span>
        <ol className="contributor-outcome-steps">
          {journey.map(({ title, detail, icon: Icon }, index) => <li key={title}>
            <Icon aria-hidden="true" />
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{title}</strong>
            <small>{detail}</small>
          </li>)}
        </ol>

        <div className="contributor-outcome-preview" aria-label="Example of a private report becoming a public benchmark">
          <section>
            <span>Verified report · private</span>
            <strong>Anonymous</strong>
            <p>Software Engineer<br />Lagos · Mid-level</p>
            <small>Gross pay</small>
            <b>₦520,000 <em>/month</em></b>
          </section>
          <ArrowRight aria-hidden="true" />
          <section>
            <span>Published benchmark · public</span>
            <strong>Software Engineer · Lagos</strong>
            <p>Based on 5 verified reports</p>
            <small>Median gross pay</small>
            <b>₦480,000 <em>/month</em></b>
            <small>Typical range: ₦420,000–₦560,000</small>
          </section>
        </div>
        <p className="contributor-outcome-privacy"><ShieldCheck aria-hidden="true" /><span><strong>Your individual salary stays out of public view.</strong> Only anonymous groups of at least five approved reports become benchmarks.</span></p>
      </div>
    </section>

    {jobCampaign && <section className="contributor-outcome-alternative" aria-labelledby="job-contribution-title">
      <BriefcaseBusiness aria-hidden="true" />
      <div>
        <h2 id="job-contribution-title">Share a paid job</h2>
        <p>Help someone find a genuine Nigerian role where the employer publishes the salary.</p>
      </div>
      <strong>{money(jobCampaign.reward_kobo)} <small>after approval</small></strong>
      <Link href="/contributors/job-sourcing" onClick={() => track("reward_offer_clicked")}>Share a paid job <ArrowRight aria-hidden="true" /></Link>
    </section>}

    <section className="contributor-outcome-journey" aria-labelledby="contributor-journey-title">
      <span className="eyebrow" id="contributor-journey-title">Your contribution journey</span>
      <ol>
        <li><span>01</span><FilePlus2 aria-hidden="true" /><strong>Submit</strong><small>Share salary or job evidence privately.</small></li>
        <li><span>02</span><ShieldCheck aria-hidden="true" /><strong>Verify</strong><small>SalarySabi checks it against clear rules.</small></li>
        <li><span>03</span><BarChart3 aria-hidden="true" /><strong>Publish safely</strong><small>Approved data helps people make decisions.</small></li>
        <li><span>04</span><WalletCards aria-hidden="true" /><strong>Reward</strong><small>Approved evidence is added to your balance.</small></li>
      </ol>
    </section>

    {salaryCampaign && <details className="reward-rules-disclosure contributor-outcome-rules" id="pilot-rules">
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

    {campaigns.length > 0 && <details className="contributor-outcome-share">
      <summary>Share SalarySabi with someone who has useful pay information <span aria-hidden="true">+</span></summary>
      <ContributorShare />
    </details>}
  </div>;
}
