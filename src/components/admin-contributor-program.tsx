"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Campaign = {
  id: string;
  slug: string;
  title: string;
  description: string;
  eligibility_note: string;
  contribution_type: "salary_report" | "job_source";
  status: "draft" | "active" | "paused" | "closed";
  reward_kobo: number;
  budget_kobo: number;
  committed_kobo: number;
  paid_kobo: number;
  target_approved: number;
  max_rewards_per_contributor: number;
  starts_at: string;
  ends_at: string;
};

type Claim = {
  id: string;
  contributor_id: string;
  contribution_type: "salary_report" | "job_source";
  source_record_id: string;
  reward_kobo: number;
  created_at: string;
  risk_score: number;
  risk_status: "low" | "review" | "high" | "blocked";
  risk_reasons: string[];
};

type ContributorProfile = { user_id: string; level: "new" | "verified" | "trusted"; status: "active" | "paused" | "banned"; approved_claims_count: number; rejected_claims_count: number; risk_status: string };
type EvidenceSnapshot = { claim_id: string; source_domain: string; page_title: string | null; salary_excerpt: string | null; fetch_status: string; fetched_at: string };

type JobEvidence = {
  id: string;
  official_url: string;
  company_name: string;
  advertised_salary: string;
  notes: string;
  submitter_email: string | null;
  review_status: string;
};

type SalaryEvidence = {
  id: string;
  role: string;
  industry: string;
  location: string;
  experience_band: string;
  company_size: string;
  monthly_gross: number;
  pay_reliability: string;
  publication_status?: "pending" | "quarantined" | "published" | "suppressed";
};

type Payout = {
  id: string;
  contributor_id: string;
  amount_kobo: number;
  payout_method: string;
  payout_destination: string;
  status: string;
};

type ClaimChecks = {
  application: boolean;
  salary: boolean;
  nigeria: boolean;
  duplicate: boolean;
  plausible: boolean;
  private: boolean;
  risk: boolean;
  anomaly: boolean;
  independence: boolean;
};

const emptyChecks: ClaimChecks = {
  application: false,
  salary: false,
  nigeria: false,
  duplicate: false,
  plausible: false,
  private: false,
  risk: false,
  anomaly: false,
  independence: false,
};

const money = (kobo: number) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
}).format(kobo / 100);

const salary = (amount: number) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
}).format(amount);

const fixtureCampaigns: Campaign[] = [
  { id: "campaign-job", slug: "transparent-jobs-pilot-2026", title: "Transparent jobs scout pilot", description: "Find current Nigerian vacancies on official employer pages where an offered salary is already visible.", eligibility_note: "Rewarded after all four source checks pass.", contribution_type: "job_source", status: "draft", reward_kobo: 100000, budget_kobo: 6000000, committed_kobo: 100000, paid_kobo: 0, target_approved: 40, max_rewards_per_contributor: 5, starts_at: "2026-08-20T00:00:00Z", ends_at: "2026-11-18T00:00:00Z" },
  { id: "campaign-salary", slug: "salary-pilot-2026", title: "Founding salary-report pilot", description: "Help unlock the first trustworthy Nigerian salary benchmark groups.", eligibility_note: "One approved reward per contributor during the pilot.", contribution_type: "salary_report", status: "active", reward_kobo: 100000, budget_kobo: 2000000, committed_kobo: 100000, paid_kobo: 0, target_approved: 20, max_rewards_per_contributor: 1, starts_at: "2026-08-20T00:00:00Z", ends_at: "2026-11-18T00:00:00Z" },
];
const fixtureClaims: Claim[] = [
  { id: "claim-job", contributor_id: "fixture-new", contribution_type: "job_source", source_record_id: "evidence-job", reward_kobo: 100000, created_at: "2026-08-20T13:30:00Z", risk_score: 55, risk_status: "review", risk_reasons: ["Several recent claims share a protected device fingerprint."] },
  { id: "claim-salary", contributor_id: "fixture-verified", contribution_type: "salary_report", source_record_id: "evidence-salary", reward_kobo: 100000, created_at: "2026-08-20T14:15:00Z", risk_score: 0, risk_status: "low", risk_reasons: [] },
];
const fixtureJobEvidence: Record<string, JobEvidence> = {
  "evidence-job": { id: "evidence-job", official_url: "https://example.com/careers/data-analyst", company_name: "Example Payments", advertised_salary: "₦550,000–₦700,000 per month", notes: "Data Analyst · Lagos · salary appears below the role summary.", submitter_email: "scout@example.com", review_status: "pending" },
};
const fixtureSalaryEvidence: Record<string, SalaryEvidence> = {
  "evidence-salary": { id: "evidence-salary", role: "Operations Analyst", industry: "Financial services", location: "Lagos", experience_band: "3-5", company_size: "51-200", monthly_gross: 480000, pay_reliability: "on-time" },
};
const fixtureProfiles: Record<string, ContributorProfile> = {
  "fixture-new": { user_id: "fixture-new", level: "new", status: "active", approved_claims_count: 0, rejected_claims_count: 0, risk_status: "review" },
  "fixture-verified": { user_id: "fixture-verified", level: "verified", status: "active", approved_claims_count: 3, rejected_claims_count: 0, risk_status: "clear" },
};
const fixtureSnapshots: Record<string, EvidenceSnapshot> = {
  "claim-job": { claim_id: "claim-job", source_domain: "example.com", page_title: "Data Analyst | Example Payments", salary_excerpt: "The offered salary is ₦550,000–₦700,000 per month.", fetch_status: "verified", fetched_at: "2026-08-20T13:30:02Z" },
};
const fixtureQuarantine: SalaryEvidence[] = [
  { id: "quarantine-salary", role: "Customer Success Manager", industry: "Technology", location: "Lagos", experience_band: "3-5", company_size: "51-200", monthly_gross: 650000, pay_reliability: "on-time", publication_status: "quarantined" },
];

export function AdminContributorProgram({ fixtureMode = false }: { fixtureMode?: boolean }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => fixtureMode ? fixtureCampaigns : []);
  const [claims, setClaims] = useState<Claim[]>(() => fixtureMode ? fixtureClaims : []);
  const [jobEvidence, setJobEvidence] = useState<Record<string, JobEvidence>>(() => fixtureMode ? fixtureJobEvidence : {});
  const [salaryEvidence, setSalaryEvidence] = useState<Record<string, SalaryEvidence>>(() => fixtureMode ? fixtureSalaryEvidence : {});
  const [profiles, setProfiles] = useState<Record<string, ContributorProfile>>(() => fixtureMode ? fixtureProfiles : {});
  const [snapshots, setSnapshots] = useState<Record<string, EvidenceSnapshot>>(() => fixtureMode ? fixtureSnapshots : {});
  const [quarantinedReports, setQuarantinedReports] = useState<SalaryEvidence[]>(() => fixtureMode ? fixtureQuarantine : []);
  const [publicationChecks, setPublicationChecks] = useState<Record<string, ClaimChecks>>({});
  const [claimChecks, setClaimChecks] = useState<Record<string, ClaimChecks>>({});
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState(fixtureMode ? "Local review fixture—no production data will change." : "Checking administrator access…");

  const load = useCallback(async () => {
    if (fixtureMode) return;
    const { data: isAdmin } = await supabase.rpc("is_current_user_admin");
    if (!isAdmin) {
      setStatus("Administrator access required.");
      return;
    }

    const [campaignResult, claimResult, payoutResult] = await Promise.all([
      supabase.from("contribution_campaigns").select("*").order("created_at"),
      supabase.from("contribution_claims").select("id,contributor_id,contribution_type,source_record_id,reward_kobo,created_at,risk_score,risk_status,risk_reasons").eq("status", "pending").order("created_at"),
      supabase.from("contributor_payout_requests").select("*").in("status", ["pending", "processing"]).order("created_at"),
    ]);
    if (campaignResult.error || claimResult.error || payoutResult.error) {
      setStatus("Contributor programme data could not be loaded.");
      return;
    }

    const pendingClaims = (claimResult.data ?? []) as Claim[];
    const jobIds = pendingClaims.filter((claim) => claim.contribution_type === "job_source").map((claim) => claim.source_record_id);
    const salaryIds = pendingClaims.filter((claim) => claim.contribution_type === "salary_report").map((claim) => claim.source_record_id);
    const contributorIds = [...new Set(pendingClaims.map((claim) => claim.contributor_id))];
    const [jobResult, salaryResult, snapshotResult, profileResult, quarantineResult] = await Promise.all([
      jobIds.length
        ? supabase.from("job_suggestions").select("id,official_url,company_name,advertised_salary,notes,submitter_email,review_status").in("id", jobIds)
        : Promise.resolve({ data: [], error: null }),
      salaryIds.length
        ? supabase.from("salary_reports").select("id,role,industry,location,experience_band,company_size,monthly_gross,pay_reliability").in("id", salaryIds)
        : Promise.resolve({ data: [], error: null }),
      pendingClaims.length
        ? supabase.from("contribution_evidence_snapshots").select("claim_id,source_domain,page_title,salary_excerpt,fetch_status,fetched_at").in("claim_id", pendingClaims.map((claim) => claim.id))
        : Promise.resolve({ data: [], error: null }),
      contributorIds.length
        ? supabase.from("contributor_profiles").select("user_id,level,status,approved_claims_count,rejected_claims_count,risk_status").in("user_id", contributorIds)
        : Promise.resolve({ data: [], error: null }),
      supabase.from("salary_reports").select("id,role,industry,location,experience_band,company_size,monthly_gross,pay_reliability,publication_status").eq("publication_status", "quarantined").order("created_at"),
    ]);
    if (jobResult.error || salaryResult.error || snapshotResult.error || profileResult.error || quarantineResult.error) {
      setStatus("Reward evidence could not be loaded. Do not approve claims until it is available.");
      return;
    }

    setCampaigns((campaignResult.data ?? []) as Campaign[]);
    setClaims(pendingClaims);
    setPayouts((payoutResult.data ?? []) as Payout[]);
    setJobEvidence(Object.fromEntries(((jobResult.data ?? []) as JobEvidence[]).map((item) => [item.id, item])));
    setSalaryEvidence(Object.fromEntries(((salaryResult.data ?? []) as SalaryEvidence[]).map((item) => [item.id, item])));
    setSnapshots(Object.fromEntries(((snapshotResult.data ?? []) as EvidenceSnapshot[]).map((item) => [item.claim_id, item])));
    setProfiles(Object.fromEntries(((profileResult.data ?? []) as ContributorProfile[]).map((item) => [item.user_id, item])));
    setQuarantinedReports((quarantineResult.data ?? []) as SalaryEvidence[]);
    setClaimChecks(Object.fromEntries(pendingClaims.map((claim) => [claim.id, { ...emptyChecks }])));
    setPublicationChecks(Object.fromEntries(((quarantineResult.data ?? []) as SalaryEvidence[]).map((report) => [report.id, { ...emptyChecks }])));
    setStatus("");
  }, [fixtureMode, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function toggleCheck(claimId: string, key: keyof ClaimChecks, checked: boolean) {
    setClaimChecks((current) => ({
      ...current,
      [claimId]: { ...(current[claimId] ?? emptyChecks), [key]: checked },
    }));
  }

  function togglePublicationCheck(reportId: string, key: "anomaly" | "independence", checked: boolean) {
    setPublicationChecks((current) => ({ ...current, [reportId]: { ...(current[reportId] ?? emptyChecks), [key]: checked } }));
  }

  async function setCampaign(campaign: Campaign, next: "active" | "paused" | "closed") {
    if (next === "active") {
      const approved = window.confirm(
        `Activate ${campaign.title}?\n\nReward: ${money(campaign.reward_kobo)} per approved contribution\nAvailable budget: ${money(campaign.budget_kobo - campaign.committed_kobo)}\nPublic offer: ${campaign.contribution_type === "job_source" ? "/contributors/job-sourcing" : "/contributors"}`,
      );
      if (!approved) return;
    }
    if (next === "closed") {
      const confirmation = window.prompt(`Closing ${campaign.title} is permanent. Type CLOSE to continue.`);
      if (confirmation !== "CLOSE") {
        setStatus("Campaign was not closed.");
        return;
      }
    }

    setBusy(`campaign-${campaign.id}`);
    setStatus("Updating campaign…");
    if (fixtureMode) {
      setCampaigns((current) => current.map((item) => item.id === campaign.id ? { ...item, status: next } : item));
      setStatus(`Local fixture campaign ${next}. No production data changed.`);
      setBusy("");
      return;
    }
    const { error } = await supabase.rpc("admin_set_contribution_campaign_status", {
      p_campaign_id: campaign.id,
      p_status: next,
    });
    setStatus(error ? error.message : `Campaign ${next}.`);
    if (!error) await load();
    setBusy("");
  }

  async function reviewClaim(claim: Claim, decision: "approved" | "rejected") {
    const checks = claimChecks[claim.id] ?? emptyChecks;
    let note = "Passed the required independent checks.";
    if (decision === "rejected") {
      const reason = window.prompt("Explain why this contribution is being rejected. This note is kept with the claim.");
      if (reason === null) return;
      if (reason.trim().length < 5) {
        setStatus("Add a clear rejection reason of at least five characters.");
        return;
      }
      note = reason.trim();
    }

    setBusy(`claim-${claim.id}`);
    setStatus("Saving reward review…");
    if (fixtureMode) {
      setClaims((current) => current.filter((item) => item.id !== claim.id));
      setStatus(`Local fixture reward claim ${decision}. No production data changed.`);
      setBusy("");
      return;
    }
    const response = claim.contribution_type === "job_source"
      ? await supabase.rpc("admin_review_job_source_claim", {
          p_claim_id: claim.id,
          p_decision: decision,
          p_note: note,
          p_application_confirmed: checks.application,
          p_salary_confirmed: checks.salary,
          p_nigeria_confirmed: checks.nigeria,
          p_duplicate_checked: checks.duplicate,
          p_risk_reviewed: checks.risk,
        })
      : await supabase.rpc("admin_review_salary_report_claim", {
          p_claim_id: claim.id,
          p_decision: decision,
          p_note: note,
          p_plausibility_confirmed: checks.plausible,
          p_privacy_confirmed: checks.private,
          p_risk_reviewed: checks.risk,
        });
    setStatus(response.error ? response.error.message : `Reward claim ${decision}.`);
    if (!response.error) await load();
    setBusy("");
  }

  async function releaseSalaryReport(report: SalaryEvidence, decision: "published" | "suppressed") {
    const checks = publicationChecks[report.id] ?? emptyChecks;
    const promptText = decision === "published"
      ? "Record why this report is safe to release into the anonymous benchmark pool."
      : "Record why this report must stay out of public benchmarks.";
    const note = window.prompt(promptText);
    if (note === null) return;
    if (note.trim().length < 5) { setStatus("Add a clear publication-review note."); return; }
    setBusy(`publication-${report.id}`);
    if (fixtureMode) {
      setQuarantinedReports((current) => current.filter((item) => item.id !== report.id));
      setStatus(`Local fixture report ${decision}. No production data changed.`);
      setBusy("");
      return;
    }
    const { error } = await supabase.rpc("admin_release_salary_report", {
      p_report_id: report.id,
      p_decision: decision,
      p_note: note.trim(),
      p_anomaly_checked: checks.anomaly,
      p_independence_checked: checks.independence,
    });
    setStatus(error ? error.message : `Salary report ${decision}.`);
    if (!error) await load();
    setBusy("");
  }

  async function setContributorStatus(profile: ContributorProfile, next: "active" | "paused" | "banned") {
    const note = window.prompt(next === "active" ? "Why is this contributor safe to restore?" : `Why should this contributor be ${next}?`);
    if (note === null) return;
    if (note.trim().length < 5) { setStatus("Record a clear account-review reason."); return; }
    if (next === "banned" && !window.confirm("Ban this contributor? New reward claims and payouts will be blocked.")) return;
    setBusy(`profile-${profile.user_id}`);
    if (fixtureMode) {
      setProfiles((current) => ({ ...current, [profile.user_id]: { ...profile, status: next } }));
      setStatus(`Local fixture contributor ${next}. No production data changed.`);
      setBusy("");
      return;
    }
    const { error } = await supabase.rpc("admin_set_contributor_account_status", { p_contributor_id: profile.user_id, p_status: next, p_note: note.trim() });
    setStatus(error ? error.message : `Contributor marked ${next}.`);
    if (!error) await load();
    setBusy("");
  }

  async function processPayout(id: string, decision: "processing" | "paid" | "rejected") {
    const reference = decision === "paid" ? window.prompt("Payment reference") : "";
    if (decision === "paid" && !reference?.trim()) return;
    if (decision === "rejected" && !window.confirm("Reject this payout request? No money will be sent.")) return;
    setBusy(`payout-${id}`);
    setStatus("Updating payout…");
    if (fixtureMode) {
      setPayouts((current) => decision === "processing" ? current.map((item) => item.id === id ? { ...item, status: "processing" } : item) : current.filter((item) => item.id !== id));
      setStatus(`Local fixture payout marked ${decision}. No production data changed.`);
      setBusy("");
      return;
    }
    const { error } = await supabase.rpc("admin_complete_contributor_payout", {
      p_request_id: id,
      p_decision: decision,
      p_reference: reference?.trim() ?? "",
    });
    setStatus(error ? error.message : `Payout marked ${decision}.`);
    if (!error) await load();
    setBusy("");
  }

  return <main className="contributor-admin" id="main-content" tabIndex={-1}>
    <header>
      <div>
        <span className="eyebrow">Contributor programme control</span>
        <h1>Budgets, campaigns and reward reviews</h1>
        <p>Campaigns remain drafts until you deliberately activate them. Every pending reward is reserved against its hard budget.</p>
      </div>
      <Link href="/admin">Back to administration</Link>
    </header>
    <p className="contributor-admin-status" role="status">{status}</p>

    <section>
      <div className="contributor-section-heading"><span className="eyebrow">Campaign controls</span><h2>Founding pilots</h2></div>
      <div className="admin-campaign-grid">
        {campaigns.map((campaign) => {
          const available = campaign.budget_kobo - campaign.committed_kobo;
          const remainingRewards = campaign.reward_kobo > 0 ? Math.floor(available / campaign.reward_kobo) : 0;
          return <article key={campaign.id}>
            <div className="admin-campaign-heading">
              <span>{campaign.contribution_type.replace("_", " ")}</span>
              <strong className={`campaign-status campaign-status-${campaign.status}`}>{campaign.status}</strong>
            </div>
            <h3>{campaign.title}</h3>
            <p>{campaign.description}</p>
            <dl>
              <div><dt>Reward</dt><dd>{money(campaign.reward_kobo)}</dd></div>
              <div><dt>Hard budget</dt><dd>{money(campaign.budget_kobo)}</dd></div>
              <div><dt>Reserved</dt><dd>{money(campaign.committed_kobo)}</dd></div>
              <div><dt>Available</dt><dd>{money(available)}</dd></div>
              <div><dt>Rewards remaining</dt><dd>{remainingRewards}</dd></div>
              <div><dt>Contributor limit</dt><dd>{campaign.max_rewards_per_contributor}</dd></div>
              <div><dt>Campaign ends</dt><dd>{new Date(campaign.ends_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</dd></div>
              <div><dt>Approval target</dt><dd>{campaign.target_approved}</dd></div>
            </dl>
            <small>{campaign.eligibility_note}</small>
            <Link className="admin-campaign-preview" href={campaign.contribution_type === "job_source" ? "/contributors/job-sourcing" : "/contributors"} target="_blank">Preview public offer</Link>
            <div className="admin-campaign-actions">
              {(campaign.status === "draft" || campaign.status === "paused") && <button className="primary-button" disabled={Boolean(busy)} onClick={() => void setCampaign(campaign, "active")}>Activate</button>}
              {campaign.status === "active" && <button disabled={Boolean(busy)} onClick={() => void setCampaign(campaign, "paused")}>Pause</button>}
              {campaign.status !== "closed" && <button className="danger-button" disabled={Boolean(busy)} onClick={() => void setCampaign(campaign, "closed")}>Close permanently</button>}
              {campaign.status === "closed" && <span className="campaign-closed-note">Closed campaigns cannot be reopened.</span>}
            </div>
          </article>;
        })}
      </div>
    </section>

    <section>
      <div className="contributor-section-heading"><span className="eyebrow">Independent review</span><h2>Pending reward claims</h2></div>
      {claims.length ? <div className="admin-claim-list">{claims.map((claim) => {
        const checks = claimChecks[claim.id] ?? emptyChecks;
        const source = jobEvidence[claim.source_record_id];
        const report = salaryEvidence[claim.source_record_id];
        const profile = profiles[claim.contributor_id];
        const snapshot = snapshots[claim.id];
        const riskNeedsReview = claim.risk_score > 0;
        const evidenceMissing = claim.contribution_type === "job_source" ? !source : !report;
        const approvalReady = claim.contribution_type === "job_source"
          ? checks.application && checks.salary && checks.nigeria && checks.duplicate && (!riskNeedsReview || checks.risk) && Boolean(source)
          : checks.plausible && checks.private && (!riskNeedsReview || checks.risk) && Boolean(report);
        return <article className="admin-claim-card" key={claim.id}>
          <header><div><span>{claim.contribution_type.replace("_", " ")}</span><strong>{money(claim.reward_kobo)} reserved</strong></div><small>{profile?.level ?? "new"} contributor · Submitted {new Date(claim.created_at).toLocaleString("en-NG")}</small></header>
          {riskNeedsReview && <aside className={`admin-risk-summary is-${claim.risk_status}`}><strong>Protected risk review required</strong><span>{claim.risk_reasons.join(" ") || "Automated checks marked this claim for review."}</span><small>Internal signal only. Verify the evidence; do not disclose detection details to the contributor.</small>{profile && <div className="admin-risk-actions">{profile.status === "active" ? <><button disabled={Boolean(busy)} onClick={() => void setContributorStatus(profile, "paused")}>Pause contributor</button><button className="danger-button" disabled={Boolean(busy)} onClick={() => void setContributorStatus(profile, "banned")}>Ban contributor</button></> : <button disabled={Boolean(busy)} onClick={() => void setContributorStatus(profile, "active")}>Restore contributor</button>}</div>}</aside>}
          {source && <section className="admin-claim-evidence">
            <div><span>Company</span><strong>{source.company_name}</strong></div>
            <div><span>Advertised salary</span><strong>{source.advertised_salary}</strong></div>
            <div className="wide"><span>Contributor notes</span><p>{source.notes || "No notes supplied."}</p></div>
            <a className="wide" href={source.official_url} rel="noopener noreferrer" target="_blank">Open official vacancy ↗</a>
          </section>}
          {snapshot && <section className="admin-source-snapshot"><strong>Server-captured source · {snapshot.fetch_status}</strong><span>{snapshot.page_title || snapshot.source_domain}</span><p>{snapshot.salary_excerpt || "No short salary excerpt was retained."}</p><small>Captured {new Date(snapshot.fetched_at).toLocaleString("en-NG")}</small></section>}
          {report && <section className="admin-claim-evidence">
            <div><span>Role</span><strong>{report.role}</strong></div>
            <div><span>Monthly gross</span><strong>{salary(report.monthly_gross)}</strong></div>
            <div><span>Location</span><strong>{report.location}</strong></div>
            <div><span>Experience</span><strong>{report.experience_band} years</strong></div>
            <div><span>Industry</span><strong>{report.industry}</strong></div>
            <div><span>Pay reliability</span><strong>{report.pay_reliability.replaceAll("-", " ")}</strong></div>
          </section>}
          {evidenceMissing && <p className="admin-claim-error">Linked evidence is unavailable. Do not approve this reward.</p>}
          {!evidenceMissing && <fieldset className="admin-claim-checks">
            <legend>Required before reward approval</legend>
            {claim.contribution_type === "job_source" ? <>
              <label><input checked={checks.application} onChange={(event) => toggleCheck(claim.id, "application", event.target.checked)} type="checkbox" /><span><strong>Vacancy is open</strong><small>I opened the official application page and confirmed it accepts applications.</small></span></label>
              <label><input checked={checks.salary} onChange={(event) => toggleCheck(claim.id, "salary", event.target.checked)} type="checkbox" /><span><strong>Offered salary is visible</strong><small>The employer states this exact amount or range and its pay period.</small></span></label>
              <label><input checked={checks.nigeria} onChange={(event) => toggleCheck(claim.id, "nigeria", event.target.checked)} type="checkbox" /><span><strong>Role is Nigeria-relevant</strong><small>The vacancy location or eligibility explicitly includes Nigeria.</small></span></label>
              <label><input checked={checks.duplicate} onChange={(event) => toggleCheck(claim.id, "duplicate", event.target.checked)} type="checkbox" /><span><strong>No duplicate exists</strong><small>I searched SalarySabi for the same company, role and application URL.</small></span></label>
            </> : <>
              <label><input checked={checks.plausible} onChange={(event) => toggleCheck(claim.id, "plausible", event.target.checked)} type="checkbox" /><span><strong>Report is complete and plausible</strong><small>The role, experience, location and monthly gross are internally consistent.</small></span></label>
              <label><input checked={checks.private} onChange={(event) => toggleCheck(claim.id, "private", event.target.checked)} type="checkbox" /><span><strong>No identifying details are exposed</strong><small>The report is safe to use only inside anonymous five-report benchmark groups.</small></span></label>
            </>}
            {riskNeedsReview && <label><input checked={checks.risk} onChange={(event) => toggleCheck(claim.id, "risk", event.target.checked)} type="checkbox" /><span><strong>Risk signals were independently reviewed</strong><small>The evidence and contributor history support this decision despite the protected warning.</small></span></label>}
          </fieldset>}
          <footer>
            <button disabled={Boolean(busy)} onClick={() => void reviewClaim(claim, "rejected")}>Reject with reason</button>
            <button className="primary-button" disabled={Boolean(busy) || !approvalReady} onClick={() => void reviewClaim(claim, "approved")}>{approvalReady ? (claim.contribution_type === "salary_report" ? "Approve reward; quarantine data" : "Approve reward") : "Complete checks to approve"}</button>
          </footer>
        </article>;
      })}</div> : <p className="contributor-empty">No reward claims are waiting for review.</p>}
    </section>

    <section>
      <div className="contributor-section-heading"><span className="eyebrow">Separate publication check</span><h2>Benchmark quarantine</h2></div>
      <p className="admin-section-intro">These contributors may already be approved for payment. Their salary data remains private until this second check releases it into an anonymous five-report group.</p>
      {quarantinedReports.length ? <div className="admin-claim-list">{quarantinedReports.map((report) => {
        const checks = publicationChecks[report.id] ?? emptyChecks;
        return <article className="admin-claim-card admin-quarantine-card" key={report.id}>
          <header><div><span>Salary report</span><strong>{salary(report.monthly_gross)} monthly</strong></div><small>Quarantined · not public</small></header>
          <section className="admin-claim-evidence"><div><span>Role</span><strong>{report.role}</strong></div><div><span>Location</span><strong>{report.location}</strong></div><div><span>Industry</span><strong>{report.industry}</strong></div><div><span>Experience</span><strong>{report.experience_band} years</strong></div></section>
          <fieldset className="admin-claim-checks"><legend>Required before public release</legend>
            <label><input checked={checks.anomaly} onChange={(event) => togglePublicationCheck(report.id, "anomaly", event.target.checked)} type="checkbox" /><span><strong>No unexplained salary anomaly</strong><small>The amount is plausible for the role and does not appear to be part of a suspicious burst.</small></span></label>
            <label><input checked={checks.independence} onChange={(event) => togglePublicationCheck(report.id, "independence", event.target.checked)} type="checkbox" /><span><strong>Cohort independence checked</strong><small>This report does not appear to be coordinated with the other reports forming its benchmark group.</small></span></label>
          </fieldset>
          <footer><button disabled={Boolean(busy)} onClick={() => void releaseSalaryReport(report, "suppressed")}>Keep out of benchmarks</button><button className="primary-button" disabled={Boolean(busy) || !checks.anomaly || !checks.independence} onClick={() => void releaseSalaryReport(report, "published")}>{checks.anomaly && checks.independence ? "Release to anonymous pool" : "Complete checks to release"}</button></footer>
        </article>;
      })}</div> : <p className="contributor-empty">No approved salary reports are waiting for publication review.</p>}
    </section>

    <section>
      <div className="contributor-section-heading"><span className="eyebrow">Payout queue</span><h2>Contributor withdrawals</h2></div>
      {payouts.length ? <div className="admin-claim-list">{payouts.map((payout) => <article className="admin-payout-card" key={payout.id}>
        <div><strong>{money(payout.amount_kobo)} · {payout.payout_method.replace("_", " ")}</strong><span>{payout.payout_destination}</span><small>{payout.status} · contributor {payout.contributor_id}</small></div>
        <div><button disabled={Boolean(busy)} onClick={() => void processPayout(payout.id, "rejected")}>Reject</button>{payout.status === "pending" && <button disabled={Boolean(busy)} onClick={() => void processPayout(payout.id, "processing")}>Start processing</button>}<button className="primary-button" disabled={Boolean(busy)} onClick={() => void processPayout(payout.id, "paid")}>Mark paid</button></div>
      </article>)}</div> : <p className="contributor-empty">No payout requests are waiting.</p>}
    </section>
  </main>;
}
