"use client";

import { useEffect, useState } from "react";

export type ActiveContributionCampaign = {
  id: string;
  slug: string;
  contribution_type: "salary_report" | "job_source";
  title: string;
  description: string;
  eligibility_note: string;
  target_approved: number;
  approved_count: number;
  reward_kobo: number;
  budget_remaining_kobo: number;
  ends_at: string;
};

type CampaignState = {
  campaigns: ActiveContributionCampaign[];
  status: "loading" | "ready" | "error";
};

const cacheDuration = 60_000;
let campaignCache: { campaigns: ActiveContributionCampaign[]; expiresAt: number } | null = null;
let campaignRequest: Promise<ActiveContributionCampaign[]> | null = null;

async function loadCampaigns() {
  if (campaignCache && campaignCache.expiresAt > Date.now()) return campaignCache.campaigns;
  if (campaignRequest) return campaignRequest;

  const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!endpoint || !key) throw new Error("Campaign data is unavailable");

  campaignRequest = fetch(`${endpoint.replace(/\/$/, "")}/rest/v1/rpc/public_active_contribution_campaigns`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: "{}",
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("Campaign data is unavailable");
      const rows = await response.json() as ActiveContributionCampaign[];
      const campaigns = rows.filter((campaign) => campaign.reward_kobo > 0 && campaign.budget_remaining_kobo >= campaign.reward_kobo);
      campaignCache = { campaigns, expiresAt: Date.now() + cacheDuration };
      return campaigns;
    })
    .finally(() => { campaignRequest = null; });

  return campaignRequest;
}

export function useActiveContributionCampaigns(enabled = true): CampaignState {
  const [state, setState] = useState<CampaignState>({
    campaigns: [],
    status: "loading",
  });

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void loadCampaigns()
      .then((campaigns) => { if (active) setState({ campaigns, status: "ready" }); })
      .catch(() => { if (active) setState({ campaigns: [], status: "error" }); });
    return () => { active = false; };
  }, [enabled]);

  return enabled ? state : { campaigns: [], status: "ready" };
}
