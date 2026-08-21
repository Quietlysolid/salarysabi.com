"use client";

import Link from "next/link";
import { useActiveContributionCampaigns } from "@/lib/active-contribution-campaigns";

const money = (kobo: number) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
}).format(kobo / 100);

export function HomepageContributions() {
  const { campaigns, status } = useActiveContributionCampaigns();
  const reward = campaigns.length > 0 ? Math.max(...campaigns.map((campaign) => campaign.reward_kobo)) : 0;

  return (
    <section className="home-contributions" aria-labelledby="home-contributions-title">
      <div>
        <span className="eyebrow">Community-powered transparency</span>
        <h2 id="home-contributions-title">Help make Nigerian pay clearer.</h2>
        <p>SalarySabi reviews anonymous salary reports and genuine job leads before they can improve public comparisons or listings. Rewards are for approved evidence, not clicks or referrals.</p>
      </div>
      <aside>
        {status === "loading" && <p role="status">Checking funded offers…</p>}
        {status === "ready" && campaigns.length > 0 && (
          <p><strong>Funded offers are open.</strong><span>Earn up to {money(reward)} after an eligible contribution is approved.</span></p>
        )}
        {status === "ready" && campaigns.length === 0 && (
          <p><strong>No funded offer is open right now.</strong><span>You can still contribute anonymously to help public salary comparisons grow.</span></p>
        )}
        {status === "error" && <p><strong>Offer status is temporarily unavailable.</strong><span>Confirm the current terms before submitting a reward claim.</span></p>}
        <div>
          <Link className="primary-button" href="/contributors">See funded offers</Link>
          <Link href="/contributions">Track my contributions</Link>
        </div>
      </aside>
    </section>
  );
}
