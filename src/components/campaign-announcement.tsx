"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/components/analytics";
import { useActiveContributionCampaigns, type ActiveContributionCampaign } from "@/lib/active-contribution-campaigns";

function rewardLabel(campaigns: ActiveContributionCampaign[]) {
  const rewards = campaigns.map((campaign) => campaign.reward_kobo);
  const reward = rewards.every((value) => value === rewards[0]) ? rewards[0] : Math.max(...rewards);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(reward / 100);
}

export function CampaignAnnouncement() {
  const pathname = usePathname();
  const enabled = ["/salaries", "/salaries-and-jobs", "/jobs"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const { campaigns } = useActiveContributionCampaigns(enabled);

  useEffect(() => {
    if (enabled && campaigns.length > 0) track("reward_offer_viewed");
  }, [campaigns.length, enabled]);

  if (!enabled || campaigns.length === 0) return null;

  const types = new Set(campaigns.map((campaign) => campaign.contribution_type));
  const task = types.size > 1
    ? "an approved salary report or verified job lead"
    : types.has("salary_report") ? "an approved salary report" : "a verified job lead";

  return <aside className="campaign-announcement" aria-label="Active funded contributor offer">
    <div className="campaign-announcement-inner">
      <p><strong>Help make Nigerian pay clearer.</strong> Earn {rewardLabel(campaigns)} for {task}.</p>
      <Link href="/contributors" onClick={() => track("reward_offer_clicked")}>See funded offers <span aria-hidden="true">→</span></Link>
    </div>
  </aside>;
}
