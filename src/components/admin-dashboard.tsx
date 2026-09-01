"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { calculateTransparencyScore, formatJobSalary, type Job } from "@/lib/jobs";
import { ExternalLinkIcon } from "@/components/external-link-icon";
import { BrandMark } from "@/components/brand-mark";
import { BrandWordmark } from "@/components/brand-wordmark";
import Link from "next/link";

type Submission = Omit<
  Job,
  | "slug"
  | "source_url"
  | "employer_verified"
  | "source_verified_at"
  | "published_at"
> & {
  contact_email: string;
  created_at: string;
  submitter_type: "employer" | "recruiter";
  recruiter_company: string | null;
  client_display_name: string | null;
  authority_confirmed: boolean;
  no_candidate_fees_confirmed: boolean;
};
type JobReport = {
  id: string;
  job_id: string;
  reason: string;
  details: string;
  reporter_email: string | null;
  created_at: string;
};
type JobSuggestion = {
  id: string;
  official_url: string;
  company_name: string;
  advertised_salary: string;
  notes: string;
  submitter_email: string | null;
  created_at: string;
};
type ImportSource = { id: string; provider: "greenhouse" | "lever"; source_key: string; company_name: string; active: boolean; nigeria_only: boolean; last_sync_at: string | null; last_sync_status: string | null; last_sync_message: string | null };
type AtsSourceResult = { sourceId: string; company: string; received: number; nigeriaRelevant: number; salaryEligible: number; drafted: number; removedIneligible?: number; duplicates: number; invalid: number; failures: string[] };
type AtsImportResult = { sourceResults?: AtsSourceResult[]; error?: string };
type Metrics = {
  published_jobs: number;
  expired_jobs: number;
  pending_submissions: number;
  open_reports: number;
  active_alerts: number;
  saved_jobs: number;
  tracked_applications: number;
  apply_clicks_30d: number;
};
type ProductAnalytics = {
  totals: Record<string, number>;
  previous: Record<string, number>;
  daily: { date: string; page_views: number; calculations: number }[];
  top_pages: { path: string; views: number }[];
  referrers: { source: string; views: number }[];
  accounts_total: number;
  accounts_30d: number;
};
type ReviewChecks = { application: boolean; salary: boolean; source: boolean };
type JobLifecycle = "live" | "review" | "expired" | "filled" | "archived";
type AddJobMode = "source" | "manual" | "ats";

const jobLifecycleLabels: Record<JobLifecycle, string> = {
  live: "Live",
  review: "Review",
  expired: "Expired",
  filled: "Filled",
  archived: "Archived",
};

function getJobLifecycle(job: Job, today: string): JobLifecycle {
  if (job.status === "archived" || job.status === "rejected") return "archived";
  if (job.status === "filled") return "filled";
  if (job.status === "draft") return "review";
  if (job.status === "expired" || job.expires_at < today) return "expired";
  return "live";
}

function extractAtsSourceKey(provider: ImportSource["provider"], rawValue: string) {
  const value = rawValue.trim();
  if (!value || /[{}\s]/.test(value) || /^(board-key|greenhouse|lever|company)$/i.test(value)) return null;
  if (!/^https?:\/\//i.test(value)) return /^[a-z0-9._-]+$/i.test(value) ? value : null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const expectedHost = provider === "greenhouse"
      ? /^(boards|job-boards)\.greenhouse\.io$/
      : /^jobs\.lever\.co$/;
    if (!expectedHost.test(hostname)) return null;
    const key = url.pathname.split("/").filter(Boolean)[0] || "";
    return /^[a-z0-9._-]+$/i.test(key) ? key : null;
  } catch {
    return null;
  }
}

function VerificationChecklist({
  checks,
  onChange,
  sourceDescription = "The source type and confidence level are acceptable.",
  stepLabel = "Step 3 · final checks",
}: {
  checks: ReviewChecks;
  onChange: (check: keyof ReviewChecks, checked: boolean) => void;
  sourceDescription?: string;
  stepLabel?: string;
}) {
  const completeCount = Object.values(checks).filter(Boolean).length;
  const items: { id: keyof ReviewChecks; title: string; description: string }[] = [
    {
      id: "application",
      title: "Application is active",
      description: "The original page still accepts applications.",
    },
    {
      id: "salary",
      title: "Salary matches the source",
      description: "Minimum, maximum and pay period match.",
    },
    {
      id: "source",
      title: "Source confidence is acceptable",
      description: sourceDescription,
    },
  ];

  return (
    <fieldset className="admin-verification-confirmations">
      <legend>{stepLabel}</legend>
      <div className="admin-verification-summary">
        <p>Tick all three after checking the original listing.</p>
        <strong aria-live="polite">{completeCount} of 3 complete</strong>
      </div>
      <div className="admin-verification-list">
        {items.map((item) => (
          <label className={checks[item.id] ? "is-complete" : ""} key={item.id}>
            <input
              checked={checks[item.id]}
              onChange={(event) => onChange(item.id, event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const analyticsCards = [
  ["page_view", "Page views"],
  ["paye_calculated", "PAYE calculations"],
  ["payslip_checked", "Payslip checks"],
  ["job_apply_clicked", "Apply clicks"],
  ["job_alert_created", "Alerts created"],
  ["job_submission_succeeded", "Jobs submitted"],
  ["reward_offer_viewed", "Reward offer views"],
  ["reward_offer_clicked", "Reward offer clicks"],
  ["reward_offer_shared", "Reward offer shares"],
  ["reward_submission_succeeded", "Reward submissions"],
  ["reward_claim_approved", "Rewards approved"],
  ["reward_payout_completed", "Rewards paid"],
] as const;

const adminFixtureReviewJobs: Job[] = [
  { id: "fixture-1", slug: "senior-devops-engineer-flutterwave", title: "Senior DevOps Engineer", company_name: "Flutterwave Technology Solutions", location: "Lagos, Nigeria", work_mode: "hybrid", employment_type: "Full time", description: "Lead platform reliability work across cloud infrastructure and deployment systems for a growing payments team.", salary_min: 700000, salary_max: 1000000, salary_period: "monthly", salary_type: "gross", salary_currency: "NGN", salary_source: "employer_disclosed", application_url: "https://example.com/jobs/devops", source_url: "https://example.com/jobs/devops", employer_verified: false, source_verified_at: "2026-08-18T10:15:00Z", published_at: "2026-08-18T10:15:00Z", expires_at: "2026-08-31", source_kind: "official_page", source_name: "Flutterwave careers", source_job_id: "fixture-source-1", canonical_url: "https://example.com/jobs/devops", source_last_seen_at: "2026-08-18T10:15:00Z", global_remote: false, engagement_type: "employee", status: "draft", source_confidence: "high", verification_status: "pending" },
  { id: "fixture-2", slug: "financial-controller-dangote", title: "Financial Controller", company_name: "Dangote Cement Plc", location: "Lagos, Nigeria", work_mode: "onsite", employment_type: "Full time", description: "Own financial controls, reporting and compliance for a large operating business in Lagos.", salary_min: 850000, salary_max: 1100000, salary_period: "monthly", salary_type: "gross", salary_currency: "NGN", salary_source: "source_reported", application_url: "https://example.com/jobs/controller", source_url: "https://example.com/jobs/controller", employer_verified: false, source_verified_at: "2026-08-17T09:00:00Z", published_at: "2026-08-17T09:00:00Z", expires_at: "2026-08-30", source_kind: "community_tip", source_name: "Official vacancy notice", source_job_id: "fixture-source-2", canonical_url: "https://example.com/jobs/controller", source_last_seen_at: "2026-08-17T09:00:00Z", global_remote: false, engagement_type: "employee", status: "draft", source_confidence: "medium", verification_status: "pending" },
  { id: "fixture-3", slug: "data-analyst-kuda", title: "Data Analyst", company_name: "Kuda Technologies", location: "Remote, Nigeria", work_mode: "remote", employment_type: "Full time", description: "Build reporting and analysis that helps product teams understand customer behaviour and business performance.", salary_min: 600000, salary_max: 800000, salary_period: "monthly", salary_type: "gross", salary_currency: "NGN", salary_source: "employer_disclosed", application_url: "https://example.com/jobs/analyst", source_url: "https://example.com/jobs/analyst", employer_verified: false, source_verified_at: "2026-08-16T12:00:00Z", published_at: "2026-08-16T12:00:00Z", expires_at: "2026-09-05", source_kind: "official_page", source_name: "Kuda careers", source_job_id: "fixture-source-3", canonical_url: "https://example.com/jobs/analyst", source_last_seen_at: "2026-08-16T12:00:00Z", global_remote: false, engagement_type: "employee", status: "draft", source_confidence: "high", verification_status: "pending" },
];

const adminFixtureJobs: Job[] = [
  ...adminFixtureReviewJobs,
  { ...adminFixtureReviewJobs[0], id: "fixture-live", slug: "product-manager-paystack", title: "Product Manager", company_name: "Paystack", location: "Lagos, Nigeria", salary_min: 900000, salary_max: 1200000, published_at: "2026-08-20T10:00:00Z", expires_at: "2026-09-20", status: "published" },
  { ...adminFixtureReviewJobs[1], id: "fixture-expired", slug: "operations-manager-interswitch", title: "Operations Manager", company_name: "Interswitch", location: "Lagos, Nigeria", salary_min: 500000, salary_max: 700000, published_at: "2026-07-20T10:00:00Z", expires_at: "2026-08-10", status: "published" },
  { ...adminFixtureReviewJobs[2], id: "fixture-filled", slug: "data-scientist-moniepoint", title: "Data Scientist", company_name: "Moniepoint", location: "Remote, Nigeria", salary_min: 800000, salary_max: 1100000, published_at: "2026-07-18T10:00:00Z", expires_at: "2026-08-12", status: "filled", filled_at: "2026-08-11T14:00:00Z" },
  { ...adminFixtureReviewJobs[0], id: "fixture-archived", slug: "finance-manager-konga", title: "Finance Manager", company_name: "Konga", location: "Lagos, Nigeria", salary_min: 650000, salary_max: 850000, published_at: "2026-07-15T10:00:00Z", expires_at: "2026-08-15", status: "archived", archived_at: "2026-08-16T09:00:00Z" },
];

const adminFixtureSources: ImportSource[] = [
  { id: "fixture-source-greenhouse", provider: "greenhouse", source_key: "flutterwave", company_name: "Flutterwave", active: true, nigeria_only: true, last_sync_at: "2026-08-19T06:30:00Z", last_sync_status: "ok", last_sync_message: "12 received" },
  { id: "fixture-source-lever", provider: "lever", source_key: "kuda", company_name: "Kuda", active: true, nigeria_only: true, last_sync_at: "2026-08-19T06:31:00Z", last_sync_status: "ok", last_sync_message: "8 received" },
];

export function AdminDashboard({ fixtureMode = false }: { fixtureMode?: boolean }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(() => fixtureMode ? ({ user: { email: "ozichi@salarysabi.com" } } as unknown as Session) : null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [jobs, setJobs] = useState<Job[]>(() => fixtureMode ? adminFixtureJobs : []);
  const [reports, setReports] = useState<JobReport[]>([]);
  const [suggestions, setSuggestions] = useState<JobSuggestion[]>([]);
  const [importSources, setImportSources] = useState<ImportSource[]>(() => fixtureMode ? adminFixtureSources : []);
  const [metrics, setMetrics] = useState<Metrics | null>(() => fixtureMode ? { published_jobs: 12, expired_jobs: 3, pending_submissions: 0, open_reports: 0, active_alerts: 8, saved_jobs: 24, tracked_applications: 9, apply_clicks_30d: 47 } : null);
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"checking" | "ready" | "error">(() => fixtureMode ? "ready" : "checking");
  const [dashboardStatus, setDashboardStatus] = useState<"idle" | "loading" | "ready" | "error" | "forbidden">("idle");
  const [activeView, setActiveView] = useState<"review" | "jobs" | "reports" | "analytics" | "add">("review");
  const [addJobMode, setAddJobMode] = useState<AddJobMode>("source");
  const [sourceUrlDraft, setSourceUrlDraft] = useState("");
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [reviewActionsSticky, setReviewActionsSticky] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [jobLifecycleFilter, setJobLifecycleFilter] = useState<JobLifecycle>("live");
  const [selectedManagedJobId, setSelectedManagedJobId] = useState("");
  const [selectedExpiredJobIds, setSelectedExpiredJobIds] = useState<string[]>([]);
  const [deleteConfirmJobId, setDeleteConfirmJobId] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [editingImportSourceId, setEditingImportSourceId] = useState("");
  const [reviewChecks, setReviewChecks] = useState<ReviewChecks>({ application: false, salary: false, source: false });
  const completedReviewChecks = Object.values(reviewChecks).filter(Boolean).length;
  const remainingReviewChecks = 3 - completedReviewChecks;
  const reviewReadyToPublish = remainingReviewChecks === 0;
  const lockedPublishLabel = `Complete ${remainingReviewChecks} ${remainingReviewChecks === 1 ? "check" : "checks"} to publish`;

  useEffect(() => {
    if (fixtureMode) {
      return;
    }
    supabase.auth.getSession().then(({ data, error }) => {
      setSession(data.session);
      setSessionStatus(error ? "error" : "ready");
      if (error) setMessage("We could not check this administrator session. Try again.");
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) =>
      setSession(nextSession),
    );
    return () => data.subscription.unsubscribe();
  }, [fixtureMode, supabase]);

  useEffect(() => {
    if (activeView !== "review") {
      return;
    }

    const updateStickyState = () => {
      const checklist = document.querySelector(".admin-verification-confirmations");
      setReviewActionsSticky(Boolean(checklist && checklist.getBoundingClientRect().top < window.innerHeight * 0.88));
    };

    const initialFrame = window.requestAnimationFrame(updateStickyState);
    window.addEventListener("scroll", updateStickyState, { passive: true });
    window.addEventListener("resize", updateStickyState);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("scroll", updateStickyState);
      window.removeEventListener("resize", updateStickyState);
    };
  }, [activeView, dashboardStatus, selectedReviewId]);

  const loadDashboard = useCallback(async () => {
    setDashboardStatus("loading");
    setMessage("");
    if (fixtureMode) {
      setJobs(adminFixtureJobs);
      setSubmissions([]);
      setSuggestions([]);
      setImportSources(adminFixtureSources);
      setReports([]);
      setMetrics({ published_jobs: 12, expired_jobs: 3, pending_submissions: 0, open_reports: 0, active_alerts: 8, saved_jobs: 24, tracked_applications: 9, apply_clicks_30d: 47 });
      setDashboardStatus("ready");
      return;
    }
    const { data: isAdmin, error: accessError } = await supabase.rpc("is_current_user_admin");
    if (accessError) {
      setDashboardStatus("error");
      setMessage("Administrator access could not be verified. Check your connection and try again.");
      return;
    }
    if (!isAdmin) {
      setDashboardStatus("forbidden");
      setMessage("This account does not have administrator access.");
      return;
    }
    const [
      submissionResult,
      suggestionResult,
      jobResult,
      reportResult,
      metricResult,
      analyticsResult,
      importSourceResult,
    ] = await Promise.all([
      supabase
        .from("job_submissions")
        .select("*")
        .eq("review_status", "pending")
        .order("created_at"),
      supabase
        .from("job_suggestions")
        .select("*")
        .eq("review_status", "pending")
        .order("created_at"),
      supabase
        .from("jobs")
        .select("*")
        .order("published_at", { ascending: false }),
      supabase
        .from("job_reports")
        .select("*")
        .eq("status", "open")
        .order("created_at"),
      supabase.rpc("admin_job_metrics"),
      supabase.rpc("admin_product_analytics"),
      supabase.from("job_import_sources").select("*").order("company_name"),
    ]);
    if (
      submissionResult.error ||
      suggestionResult.error ||
      jobResult.error ||
      reportResult.error ||
      metricResult.error
    ) {
      setDashboardStatus("error");
      setMessage("Part of the administration dashboard could not be loaded.");
      return;
    }
    setSubmissions(submissionResult.data ?? []);
    setSuggestions(suggestionResult.data ?? []);
    setImportSources(importSourceResult.error ? [] : (importSourceResult.data ?? []));
    setJobs(jobResult.data ?? []);
    setReports(reportResult.data ?? []);
    setMetrics(metricResult.data as Metrics);
    if (!analyticsResult.error) setProductAnalytics(analyticsResult.data as ProductAnalytics);
    setDashboardStatus("ready");
    setMessage("");
  }, [fixtureMode, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session) void loadDashboard();
  }, [loadDashboard, session]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy("sign-in");
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.get("email")),
      password: String(data.get("password")),
    });
    setMessage(error ? "Sign-in failed. Check the approved email and password, then try again." : "Signed in. Verifying administrator access.");
    setBusy(null);
  }

  async function review(
    id: string,
    action: "approve_verified_job_submission" | "reject_job_submission",
  ) {
    setBusy(id);
    const { error } = await supabase.rpc(action, action === "approve_verified_job_submission" ? { p_submission_id: id, p_application_confirmed: reviewChecks.application, p_salary_confirmed: reviewChecks.salary, p_source_confirmed: reviewChecks.source } : { p_submission_id: id });
    setMessage(
      error
        ? error.message
        : action.startsWith("approve")
          ? "Job published."
          : "Submission rejected.",
    );
    if (!error) await loadDashboard();
    setBusy(null);
  }

  async function saveJob(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setBusy(id);
    const data = new FormData(event.currentTarget);
    const changes = {
      title: String(data.get("title")),
      company_name: String(data.get("company_name")),
      location: String(data.get("location")),
      description: String(data.get("description")),
      application_url: String(data.get("application_url")),
      expires_at: String(data.get("expires_at")),
      salary_min: Number(data.get("salary_min")),
      salary_max: Number(data.get("salary_max")),
      salary_type: String(data.get("salary_type")),
      salary_period: String(data.get("salary_period")),
      work_mode: String(data.get("work_mode")),
      employment_type: String(data.get("employment_type")),
      salary_currency: String(data.get("salary_currency")),
      salary_source: String(data.get("salary_source")),
      engagement_type: String(data.get("engagement_type")),
      source_kind: String(data.get("source_kind")),
      source_name: String(data.get("source_name")) || null,
      source_url: String(data.get("source_url")) || null,
      canonical_url: String(data.get("canonical_url")) || null,
      global_remote: data.get("global_remote") === "on",
      employer_verified: data.get("employer_verified") === "on",
      source_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (fixtureMode) {
      setJobs((current) => current.map((job) => job.id === id ? { ...job, ...changes } as Job : job));
      setMessage("Job updated. Local fixture only.");
      setBusy(null);
      return;
    }
    const { error } = await supabase.from("jobs").update(changes).eq("id", id);
    setMessage(error ? error.message : "Job updated.");
    if (!error) await loadDashboard();
    setBusy(null);
  }

  async function saveReviewJob(event: FormEvent<HTMLFormElement>, job: Job, publish: boolean) {
    event.preventDefault();
    if (publish && (!reviewChecks.application || !reviewChecks.salary || !reviewChecks.source)) {
      setMessage("Complete all three evidence confirmations before publishing.");
      return;
    }
    setBusy(job.id);
    const data = new FormData(event.currentTarget);
    const { error } = await supabase.from("jobs").update({
      title: String(data.get("title")).trim(),
      company_name: String(data.get("company_name")).trim(),
      location: String(data.get("location")).trim(),
      salary_min: Number(data.get("salary_min")),
      salary_max: Number(data.get("salary_max")),
      salary_period: String(data.get("salary_period")),
      expires_at: String(data.get("expires_at")),
      status: publish ? "published" : job.status,
      ...(publish ? { salary_verified_at: new Date().toISOString(), application_verified_at: new Date().toISOString(), verification_status: "verified" } : {}),
      source_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    setMessage(error ? error.message : publish ? "Job checked and published." : "Draft saved.");
    if (!error) await loadDashboard();
    setBusy(null);
  }

  async function setJobStatus(
    id: string,
    status: "draft" | "published" | "expired" | "filled" | "archived",
  ) {
    const job = jobs.find((item) => item.id === id);
    if (!job) return;
    if (status === "published" && job.expires_at < new Date().toISOString().slice(0, 10)) {
      setMessage("Update the deadline before republishing this job.");
      return;
    }
    setBusy(id);
    const updates = {
      status,
      filled_at: status === "filled" ? new Date().toISOString() : null,
      archived_at: status === "archived" ? new Date().toISOString() : null,
      ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    };
    if (fixtureMode) {
      setJobs((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
      setMessage(status === "archived" ? "Job archived." : status === "published" ? "Job republished." : status === "draft" ? "Job returned to review." : status === "filled" ? "Job marked filled." : "Job expired.");
      setBusy(null);
      return;
    }
    const { error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", id);
    setMessage(
      error
        ? error.message
        : status === "archived"
          ? "Job archived."
          : status === "published"
            ? "Job republished."
            : status === "draft"
          ? "Job returned to the review queue."
          : status === "filled"
            ? "Job marked filled."
            : "Job expired.",
    );
    if (!error) await loadDashboard();
    setBusy(null);
  }

  async function createOfficialJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("official-job");
    const form = event.currentTarget;
    const data = new FormData(form);
    const id = crypto.randomUUID();
    const title = String(data.get("title")).trim();
    const company = String(data.get("company_name")).trim();
    const officialUrl = String(data.get("source_url")).trim();
    const slug = `${title}-${company}-${id.slice(0, 8)}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const now = new Date().toISOString();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const publish = submitter instanceof HTMLButtonElement && submitter.value === "publish";
    const deadlineStatus = String(data.get("deadline_status"));
    const sourceKind = String(data.get("source_kind"));
    const transparencyScore = calculateTransparencyScore({
      salaryDisclosed: true,
      deadlineKnown: deadlineStatus !== "unknown" && deadlineStatus !== "rolling",
      employerNamed: data.get("employer_named") === "on",
      workArrangementClear: true,
      roleSpecific: data.get("role_specific") === "on",
      companyApplication: data.get("company_application") === "on",
      recentlyChecked: true,
      contradictoryOrTemplated: data.get("contradictory_or_templated") === "on",
      identityUnverifiable: data.get("identity_unverifiable") === "on",
    });
    const transparencyNotes = String(data.get("transparency_notes") || "").split(/\r?\n/).map((note) => note.trim()).filter(Boolean);
    const { error } = await supabase
      .from("jobs")
      .insert({
        id,
        slug,
        title,
        company_name: company,
        location: String(data.get("location")).trim(),
        work_mode: data.get("work_mode"),
        employment_type: String(data.get("employment_type")),
        description: String(data.get("description")).trim(),
        salary_min: Number(data.get("salary_min")),
        salary_max: Number(data.get("salary_max")),
        salary_period: data.get("salary_period"),
        salary_type: data.get("salary_type"),
        salary_currency: data.get("salary_currency"),
        salary_source: data.get("salary_source"),
        engagement_type: data.get("engagement_type"),
        application_url: String(data.get("application_url") || officialUrl).trim(),
        source_url: officialUrl,
        canonical_url: officialUrl,
        source_kind: sourceKind,
        source_name: String(data.get("source_name") || company).trim(),
        source_verified_at: now,
        source_last_seen_at: now,
        employer_verified: false,
        global_remote: data.get("global_remote") === "on",
        published_at: now,
        expires_at: data.get("expires_at"),
        deadline_status: deadlineStatus,
        transparency_score: transparencyScore,
        transparency_notes: transparencyNotes,
        status: publish ? "published" : "draft",
        source_confidence: sourceKind === "official_page" ? "high" : "medium",
        salary_verified_at: publish ? now : null,
        application_verified_at: publish ? now : null,
        verification_status: publish ? "verified" : "pending",
      });
    setMessage(
      error
        ? error.message
        : publish ? "Curated listing published." : "Curation draft saved for review.",
    );
    if (!error) {
      form.reset();
      await loadDashboard();
    }
    setBusy(null);
  }

  async function createImportSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const provider = String(data.get("provider")) as ImportSource["provider"];
    const sourceKeyInput = form.elements.namedItem("source_key") as HTMLInputElement;
    const sourceKey = extractAtsSourceKey(provider, String(data.get("source_key")));
    if (!sourceKey) {
      sourceKeyInput.setCustomValidity(`Paste a valid ${provider === "greenhouse" ? "Greenhouse" : "Lever"} careers URL or enter only its board key.`);
      sourceKeyInput.reportValidity();
      return;
    }

    setBusy("import-source");
    const companyName = String(data.get("company_name")).trim();
    if (fixtureMode) {
      setImportSources(current => [...current, { id: crypto.randomUUID(), provider, source_key: sourceKey, company_name: companyName, active: true, nigeria_only: true, last_sync_at: null, last_sync_status: null, last_sync_message: null }]);
      setMessage(`${companyName} was added. Its first import will run at 06:30 UTC.`);
      form.reset();
      setBusy(null);
      return;
    }

    const { error } = await supabase.from("job_import_sources").insert({ provider, source_key: sourceKey, company_name: companyName, nigeria_only: true, active: true });
    setMessage(error ? error.message : "ATS source added. Its salary-bearing Nigerian jobs will enter the review queue after the next import.");
    if (!error) { form.reset(); await loadDashboard(); }
    setBusy(null);
  }

  async function archiveSelectedExpiredJobs() {
    const eligibleIds = selectedExpiredJobIds.filter((id) => {
      const job = jobs.find((item) => item.id === id);
      return job && getJobLifecycle(job, new Date().toISOString().slice(0, 10)) === "expired";
    });
    if (!eligibleIds.length) return;
    setBusy("bulk-archive");
    const now = new Date().toISOString();
    if (fixtureMode) {
      setJobs((current) => current.map((job) => eligibleIds.includes(job.id) ? { ...job, status: "archived", archived_at: now, updated_at: now } : job));
      setSelectedExpiredJobIds([]);
      setMessage(`${eligibleIds.length} expired ${eligibleIds.length === 1 ? "job" : "jobs"} archived.`);
      setBusy(null);
      return;
    }
    const { error } = await supabase.from("jobs").update({ status: "archived", archived_at: now, updated_at: now }).in("id", eligibleIds);
    setMessage(error ? error.message : `${eligibleIds.length} expired ${eligibleIds.length === 1 ? "job" : "jobs"} archived.`);
    if (!error) {
      setSelectedExpiredJobIds([]);
      await loadDashboard();
    }
    setBusy(null);
  }

  async function deleteJobPermanently(job: Job) {
    if (deleteConfirmation !== job.title) return;
    setBusy(`delete-job-${job.id}`);
    if (fixtureMode) {
      setJobs((current) => current.filter((item) => item.id !== job.id));
      setDeleteConfirmJobId("");
      setDeleteConfirmation("");
      setMessage(`${job.title} was permanently deleted. Local fixture only.`);
      setBusy(null);
      return;
    }
    const { data, error } = await supabase.rpc("admin_delete_job", { p_job_id: job.id, p_confirmation: deleteConfirmation });
    if (error) {
      setMessage(error.message);
    } else {
      const result = data as { saved_jobs_removed?: number; applications_removed?: number; reports_removed?: number } | null;
      const related = (result?.saved_jobs_removed ?? 0) + (result?.applications_removed ?? 0) + (result?.reports_removed ?? 0);
      setMessage(`${job.title} was permanently deleted${related ? ` with ${related} related records` : ""}.`);
      setDeleteConfirmJobId("");
      setDeleteConfirmation("");
      await loadDashboard();
    }
    setBusy(null);
  }

  async function deleteImportSource(source: ImportSource) {
    const confirmed = window.confirm(
      `Remove ${source.company_name} from automatic ${source.provider === "greenhouse" ? "Greenhouse" : "Lever"} imports?\n\nFuture imports will stop. Jobs already in SalarySabi will not be deleted.`,
    );
    if (!confirmed) return;

    const busyKey = `delete-source-${source.id}`;
    setBusy(busyKey);
    setMessage("");
    if (fixtureMode) {
      setImportSources(current => current.filter(item => item.id !== source.id));
      setMessage(`${source.company_name} was removed from automatic imports.`);
      setBusy(null);
      return;
    }

    const { error } = await supabase
      .from("job_import_sources")
      .delete()
      .eq("id", source.id);
    setMessage(error ? error.message : `${source.company_name} was removed from automatic imports.`);
    if (!error) await loadDashboard();
    setBusy(null);
  }

  async function updateImportSource(event: FormEvent<HTMLFormElement>, source: ImportSource) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const provider = String(data.get("provider")) as ImportSource["provider"];
    const sourceKeyInput = form.elements.namedItem("source_key") as HTMLInputElement;
    const sourceKey = extractAtsSourceKey(provider, String(data.get("source_key")));
    if (!sourceKey) {
      sourceKeyInput.setCustomValidity(`Paste a valid ${provider === "greenhouse" ? "Greenhouse" : "Lever"} careers URL or enter only its board key.`);
      sourceKeyInput.reportValidity();
      return;
    }

    const companyName = String(data.get("company_name")).trim();
    const busyKey = `edit-source-${source.id}`;
    setBusy(busyKey);
    setMessage("");
    if (fixtureMode) {
      setImportSources(current => current.map(item => item.id === source.id ? { ...item, provider, source_key: sourceKey, company_name: companyName, last_sync_at: null, last_sync_status: null, last_sync_message: null } : item));
      setEditingImportSourceId("");
      setMessage(`${companyName} was updated. The revised source will be used for the next import.`);
      setBusy(null);
      return;
    }

    const { error } = await supabase
      .from("job_import_sources")
      .update({ provider, source_key: sourceKey, company_name: companyName, last_sync_status: null, last_sync_message: null })
      .eq("id", source.id);
    setMessage(error ? error.message : `${companyName} was updated. The revised source will be used for the next import.`);
    if (!error) {
      setEditingImportSourceId("");
      await loadDashboard();
    }
    setBusy(null);
  }

  async function runImportSource(source: ImportSource) {
    const busyKey = `import-source-${source.id}`;
    setBusy(busyKey);
    setMessage("");

    if (fixtureMode) {
      const sourceResult: AtsSourceResult = source.provider === "greenhouse"
        ? { sourceId: source.id, company: source.company_name, received: 13, nigeriaRelevant: 2, salaryEligible: 0, drafted: 0, duplicates: 0, invalid: 0, failures: [] }
        : { sourceId: source.id, company: source.company_name, received: 8, nigeriaRelevant: 2, salaryEligible: 1, drafted: 1, duplicates: 0, invalid: 0, failures: [] };
      const summary = `${sourceResult.received} found · ${sourceResult.nigeriaRelevant} Nigeria-relevant · ${sourceResult.salaryEligible} with salary · ${sourceResult.drafted} drafted`;
      setImportSources(current => current.map(item => item.id === source.id ? { ...item, last_sync_at: new Date().toISOString(), last_sync_status: "ok", last_sync_message: summary } : item));
      setMessage(`${source.company_name}: ${sourceResult.received} jobs found · ${sourceResult.nigeriaRelevant} Nigeria-relevant · ${sourceResult.salaryEligible} with published salary · ${sourceResult.drafted} ${sourceResult.drafted === 1 ? "draft" : "drafts"} added.`);
      setBusy(null);
      return;
    }

    const { data, error } = await supabase.functions.invoke<AtsImportResult>("import-ats-jobs", { body: { sourceId: source.id } });
    if (error || data?.error) {
      setMessage(error?.message || data?.error || "This source could not be checked. Try again.");
      setBusy(null);
      return;
    }

    const sourceResult = data?.sourceResults?.[0];
    if (!sourceResult) {
      setMessage("The importer returned no result for this source. Confirm that it is still active.");
      setBusy(null);
      return;
    }
    await loadDashboard();
    const removedMessage = sourceResult.removedIneligible ? ` · ${sourceResult.removedIneligible} invalid ${sourceResult.removedIneligible === 1 ? "draft" : "drafts"} removed` : "";
    setMessage(`${source.company_name}: ${sourceResult.received} jobs found · ${sourceResult.nigeriaRelevant} Nigeria-relevant · ${sourceResult.salaryEligible} with published salary · ${sourceResult.drafted} ${sourceResult.drafted === 1 ? "draft" : "drafts"} added${removedMessage}.`);
    setBusy(null);
  }

  async function closeReport(id: string, status: "reviewed" | "dismissed") {
    setBusy(id);
    const { error } = await supabase
      .from("job_reports")
      .update({ status })
      .eq("id", id);
    setMessage(error ? error.message : "Report closed.");
    if (!error) await loadDashboard();
    setBusy(null);
  }

  async function reviewSuggestion(id: string, status: "reviewed" | "rejected") {
    setBusy(id);
    const { error } = await supabase
      .from("job_suggestions")
      .update({ review_status: status })
      .eq("id", id);
    setMessage(error ? error.message : "Suggestion closed.");
    if (!error) await loadDashboard();
    setBusy(null);
  }

  if (sessionStatus === "checking") return (
    <section className="admin-entry-state" aria-live="polite">
      <BrandMark />
      <span className="eyebrow">Restricted workspace</span>
      <h1>Checking administrator access</h1>
      <p>SalarySabi is securely checking the session in this browser.</p>
    </section>
  );

  if (!session)
    return (
      <section className="admin-entry">
        <header className="admin-entry-brand">
          <Link aria-label="SalarySabi home" className="brand" href="/"><BrandWordmark /></Link>
          <span>Internal operations</span>
        </header>
        <div className="admin-entry-grid">
          <div className="admin-entry-intro">
            <span className="eyebrow light">Restricted workspace</span>
            <h1>SalarySabi jobs administration</h1>
            <p>Review submitted roles, verify salary evidence, respond to reports and maintain published listings.</p>
            <dl>
              <div><dt>Access</dt><dd>Approved administrators only</dd></div>
              <div><dt>Session</dt><dd>Managed securely in this browser</dd></div>
              <div><dt>Public site</dt><dd><Link href="/jobs">Return to salary-transparent jobs</Link></dd></div>
            </dl>
          </div>
          <form className="admin-login" onSubmit={signIn}>
            <div><span className="eyebrow">Administrator sign in</span><h2>Continue to the workspace</h2><p>Use the email assigned administrator access.</p></div>
            <label>Email<input autoComplete="username" type="email" name="email" required /></label>
            <label>Password<input autoComplete="current-password" type="password" name="password" required /></label>
            <button className="primary-button" disabled={busy === "sign-in"} type="submit">{busy === "sign-in" ? "Checking access..." : "Sign in securely"}</button>
            <p className={message ? "form-message error" : "form-message"} role="status">{message}</p>
            <small>Having trouble? Confirm that you are using the approved administrator account, then try again.</small>
          </form>
        </div>
      </section>
    );

  const draftJobs = jobs.filter((job) => job.status === "draft");
  const today = new Date().toISOString().slice(0, 10);
  const lifecycleCounts = jobs.reduce<Record<JobLifecycle, number>>((counts, job) => {
    counts[getJobLifecycle(job, today)] += 1;
    return counts;
  }, { live: 0, review: 0, expired: 0, filled: 0, archived: 0 });
  const managedJobs = jobs.filter((job) => getJobLifecycle(job, today) === jobLifecycleFilter);
  const effectiveManagedJobId = managedJobs.some((job) => job.id === selectedManagedJobId) ? selectedManagedJobId : managedJobs[0]?.id || "";
  const selectedManagedJob = managedJobs.find((job) => job.id === effectiveManagedJobId);
  const reviewQueue = [
    ...draftJobs.map((job) => ({ id: job.id, kind: "draft" as const, title: job.title, company: job.company_name, location: job.location, salary: formatJobSalary(job) })),
    ...submissions.map((item) => ({ id: item.id, kind: "submission" as const, title: item.title, company: item.company_name, location: item.location, salary: formatJobSalary(item) })),
  ];
  const effectiveReviewId = selectedReviewId || reviewQueue[0]?.id || "";
  const selectedDraft = draftJobs.find((job) => job.id === effectiveReviewId);
  const selectedSubmission = submissions.find((item) => item.id === effectiveReviewId);
  const activeImportSources = importSources.filter((source) => source.active);
  const lastSuccessfulSync = activeImportSources
    .filter((source) => source.last_sync_status === "ok" && source.last_sync_at)
    .sort((a, b) => String(b.last_sync_at).localeCompare(String(a.last_sync_at)))[0]?.last_sync_at;

  return (
    <section className="admin-shell">
      <header className="admin-topbar">
        <Link aria-label="SalarySabi home" className="brand" href="/"><BrandWordmark /></Link>
        <nav aria-label="Administration sections">
          {([['review', 'Review'], ['jobs', 'Jobs'], ['reports', 'Reports']] as const).map(([view, label]) => (
            <button aria-current={activeView === view ? "page" : undefined} className={activeView === view ? "is-active" : ""} key={view} onClick={() => { setMoreMenuOpen(false); setActiveView(view); }} type="button">{label}{view === "review" && reviewQueue.length ? <span>{reviewQueue.length}</span> : null}</button>
          ))}
        </nav>
        <div className="admin-topbar-actions">
          <button className="admin-add-job" onClick={() => { setMoreMenuOpen(false); setAddJobMode("source"); setActiveView("add"); }} type="button">Add job</button>
          <details className={`admin-more-menu${activeView === "analytics" ? " is-active" : ""}`} onToggle={(event) => setMoreMenuOpen(event.currentTarget.open)} open={moreMenuOpen}>
            <summary>More</summary>
            <div>
              <button className="admin-more-add-job" onClick={() => { setMoreMenuOpen(false); setAddJobMode("source"); setActiveView("add"); }} type="button">Add job</button>
              <button onClick={() => { setMoreMenuOpen(false); setActiveView("analytics"); }} type="button">Analytics</button>
              <Link href="/admin/contributors" onClick={() => setMoreMenuOpen(false)}>Rewards</Link>
              <button onClick={() => { setMoreMenuOpen(false); void supabase.auth.signOut(); }} type="button">Sign out</button>
            </div>
          </details>
        </div>
      </header>
      <div className={`admin-dashboard-status is-${dashboardStatus}${message ? " has-message" : ""}`} role="status">
        <span>{dashboardStatus === "loading" ? "Loading the latest administration data..." : message}</span>
        {dashboardStatus === "error" && <button type="button" onClick={() => void loadDashboard()}>Try again</button>}
        {dashboardStatus === "forbidden" && <button type="button" onClick={() => supabase.auth.signOut()}>Use another account</button>}
      </div>
      {activeView === "review" && reviewQueue.length > 0 && <section className="admin-review-intro">
        <div><span className="eyebrow">Today&apos;s work</span><h1>{reviewQueue.length} {reviewQueue.length === 1 ? "job needs" : "jobs need"} your review.</h1><p>Start with the oldest listing and publish only when the evidence matches.</p></div>
        <a className="primary-button" href="#review-title">Review next job</a>
      </section>}

      {activeView === "analytics" && metrics && <section className="admin-attention" aria-labelledby="admin-attention-title">
        <header><span className="eyebrow">At a glance</span><h1 id="admin-attention-title">What needs attention.</h1></header>
        <div className="admin-attention-grid">
          <button onClick={() => setActiveView("review")} type="button"><strong>{reviewQueue.length}</strong><span>Jobs need review</span><small>Start with the oldest</small></button>
          <button onClick={() => { setJobLifecycleFilter("expired"); setActiveView("jobs"); }} type="button"><strong>{metrics.expired_jobs.toLocaleString()}</strong><span>Expired jobs</span><small>Republish or archive</small></button>
          <article><strong>{metrics.apply_clicks_30d.toLocaleString()}</strong><span>Application clicks</span><small>In the last 30 days</small></article>
        </div>
      </section>}

      {activeView === "review" && <section className="admin-review-workspace" aria-labelledby="review-title">
        <button aria-controls="admin-review-queue" aria-expanded={mobileQueueOpen} className="admin-mobile-queue-toggle" onClick={() => setMobileQueueOpen(current => !current)} type="button"><span>{reviewQueue.length} {reviewQueue.length === 1 ? "job" : "jobs"} in queue</span><strong>{mobileQueueOpen ? "Hide queue" : "Choose a job"}</strong></button>
        <aside className={`admin-review-queue${mobileQueueOpen ? " is-mobile-open" : ""}`} id="admin-review-queue">
          <header><div><span className="eyebrow">Review queue</span><strong>{reviewQueue.length}</strong></div><small>Oldest first</small></header>
          {dashboardStatus === "loading" ? <div className="admin-review-empty"><strong>Loading review queue…</strong><p>Checking submissions and imported jobs.</p></div> : dashboardStatus === "error" ? <div className="admin-review-empty is-error"><strong>Review queue unavailable.</strong><p>This is not an empty queue. Reload the dashboard before reviewing or publishing jobs.</p><button onClick={() => void loadDashboard()} type="button">Try again</button></div> : reviewQueue.length ? reviewQueue.map((item) => <button className={item.id === effectiveReviewId ? "is-selected" : ""} key={`${item.kind}-${item.id}`} onClick={() => { setSelectedReviewId(item.id); setReviewChecks({ application: false, salary: false, source: false }); setMobileQueueOpen(false); }} type="button"><strong>{item.title}</strong><span>{item.company}</span><small>{item.location} · {item.salary}</small></button>) : <div className="admin-review-empty"><strong>Queue clear.</strong><p>No jobs need review right now.</p><small>{activeImportSources.length} active ATS {activeImportSources.length === 1 ? "source" : "sources"} · Next import daily at 06:30 UTC</small></div>}
        </aside>
        <section className="admin-review-canvas">
          <header><div><span className="eyebrow">Reviewing</span><h1 id="review-title">{selectedDraft?.title || selectedSubmission?.title || "Nothing waiting"}</h1><p>{selectedDraft?.company_name || selectedSubmission?.company_name || "New submissions and imported jobs will appear here."}</p></div>{(selectedDraft || selectedSubmission) && <strong className="admin-review-salary">{formatJobSalary((selectedDraft || selectedSubmission)!)}</strong>}</header>
          {selectedDraft && <form onSubmit={(event) => {
            const submitter = (event.nativeEvent as SubmitEvent).submitter;
            void saveReviewJob(event, selectedDraft, submitter instanceof HTMLButtonElement && submitter.value === "publish");
          }}>
            <section className={selectedDraft.source_url ? "admin-review-step" : "admin-review-step is-warning"}>
              <div><span className="eyebrow">Step 1</span><h2>Open and check the original listing</h2><p>Confirm that applications are open and the advertised salary is visible.</p></div>
              {selectedDraft.source_url ? <a className="primary-button" href={selectedDraft.source_url} rel="noopener noreferrer" target="_blank">Open original listing <ExternalLinkIcon /></a> : <strong>Source link missing</strong>}
            </section>
            <section className="admin-review-match">
              <div><span className="eyebrow">Step 2</span><h2>Check the captured details</h2><p>The essentials are shown first. Edit only when something does not match the source.</p></div>
              <dl className="admin-review-snapshot">
                <div><dt>Location</dt><dd>{selectedDraft.location}</dd></div>
                <div><dt>Deadline</dt><dd>{new Date(`${selectedDraft.expires_at}T12:00:00`).toLocaleDateString("en-NG", { dateStyle: "medium" })}</dd></div>
                <div><dt>Source</dt><dd>{selectedDraft.source_name || "Not named"}</dd></div>
                <div><dt>Last checked</dt><dd>{selectedDraft.source_last_seen_at?.slice(0, 10) || selectedDraft.source_verified_at.slice(0, 10)}</dd></div>
              </dl>
              <details className="admin-review-fields">
                <summary><span>Edit listing details</span><small>Open only if the source and captured listing differ.</small></summary>
                <details className="admin-source-disclosure">
                  <summary>View source details</summary>
                  <dl><div><dt>Source</dt><dd>{selectedDraft.source_name || "Not named"}</dd></div><div><dt>Type</dt><dd>{selectedDraft.source_kind.replaceAll('_', ' ')}</dd></div><div><dt>Salary evidence</dt><dd>{selectedDraft.salary_source.replaceAll('_', ' ')}</dd></div><div><dt>Last checked</dt><dd>{selectedDraft.source_last_seen_at?.slice(0, 10) || selectedDraft.source_verified_at.slice(0, 10)}</dd></div></dl>
                </details>
                <div className="job-form-grid"><label>Job title<input name="title" defaultValue={selectedDraft.title} required /></label><label>Company<input name="company_name" defaultValue={selectedDraft.company_name} required /></label><label>Location<input name="location" defaultValue={selectedDraft.location} required /></label><label>Deadline<input name="expires_at" type="date" defaultValue={selectedDraft.expires_at} required /></label><label>Minimum salary<input name="salary_min" type="number" min="1" defaultValue={selectedDraft.salary_min} required /></label><label>Maximum salary<input name="salary_max" type="number" min="1" defaultValue={selectedDraft.salary_max} required /></label><label>Salary period<select name="salary_period" defaultValue={selectedDraft.salary_period}><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label></div>
              </details>
            </section>
            <VerificationChecklist checks={reviewChecks} onChange={(check, checked) => setReviewChecks(current => ({ ...current, [check]: checked }))} />
            <footer className={`admin-review-actions${reviewActionsSticky ? " is-sticky" : ""}`}>
              <div className={reviewReadyToPublish ? "admin-publication-status is-ready" : "admin-publication-status"}>
                <strong>{reviewReadyToPublish ? "Ready to publish" : "Publication locked"}</strong>
                <span>{reviewReadyToPublish ? "All source checks are complete." : `${remainingReviewChecks} ${remainingReviewChecks === 1 ? "check remains" : "checks remain"}.`}</span>
              </div>
              <div className="admin-review-action-buttons">
                <button className="admin-reject-button" disabled={busy === selectedDraft.id} onClick={() => void setJobStatus(selectedDraft.id, "expired")} type="button">Reject</button>
                <button className="admin-save-button" disabled={busy === selectedDraft.id} value="draft">Save draft</button>
                <button className="primary-button" disabled={dashboardStatus !== "ready" || busy === selectedDraft.id || !reviewReadyToPublish} value="publish">{reviewReadyToPublish ? "Publish verified job" : lockedPublishLabel}</button>
              </div>
            </footer>
          </form>}
          {selectedSubmission && <div className="admin-submission-review">
            <section className="admin-review-step">
              <div><span className="eyebrow">Step 1</span><h2>Open and check the submitted listing</h2><p>Confirm that applications are open, the salary is visible and no candidate fee is requested.</p></div>
              <a className="primary-button" href={selectedSubmission.application_url} rel="noopener noreferrer" target="_blank">Open application page <ExternalLinkIcon /></a>
            </section>
            <details className="admin-submission-disclosure"><summary>View submission details</summary><div><strong>Submitted by</strong><span>{selectedSubmission.contact_email}</span><strong>Deadline</strong><span>{selectedSubmission.expires_at}</span><strong>No-fee declaration</strong><span>{selectedSubmission.no_candidate_fees_confirmed ? "Confirmed" : "Missing"}</span><p>{selectedSubmission.description}</p></div></details>
            <VerificationChecklist checks={reviewChecks} onChange={(check, checked) => setReviewChecks(current => ({ ...current, [check]: checked }))} sourceDescription="The submitter identity and source confidence are acceptable." stepLabel="Step 2 · final checks" />
            <footer className={`admin-review-actions${reviewActionsSticky ? " is-sticky" : ""}`}><div className={reviewReadyToPublish ? "admin-publication-status is-ready" : "admin-publication-status"}><strong>{reviewReadyToPublish ? "Ready to approve" : "Publication locked"}</strong><span>{reviewReadyToPublish ? "All source checks are complete." : `${remainingReviewChecks} ${remainingReviewChecks === 1 ? "check remains" : "checks remain"}.`}</span></div><div className="admin-review-action-buttons"><button className="admin-reject-button" disabled={busy === selectedSubmission.id} onClick={() => review(selectedSubmission.id, "reject_job_submission")} type="button">Reject</button><button className="primary-button" disabled={busy === selectedSubmission.id || !reviewReadyToPublish} onClick={() => review(selectedSubmission.id, "approve_verified_job_submission")} type="button">{reviewReadyToPublish ? "Approve verified job" : lockedPublishLabel}</button></div></footer>
          </div>}
          {!selectedDraft && !selectedSubmission && dashboardStatus === "ready" && <section className="admin-empty-operations" aria-labelledby="empty-operations-title"><div><span className="eyebrow">System ready</span><h2 id="empty-operations-title">Nothing needs review.</h2><p>New employer submissions and salary-bearing ATS jobs will appear here automatically as drafts.</p></div><dl><div><dt>Active ATS sources</dt><dd>{activeImportSources.length}</dd></div><div><dt>Last successful sync</dt><dd>{lastSuccessfulSync ? new Date(lastSuccessfulSync).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "Not synced yet"}</dd></div><div><dt>Next scheduled import</dt><dd>Daily at 06:30 UTC</dd></div></dl><div><button className="primary-button" onClick={() => { setAddJobMode("ats"); setActiveView("add"); }} type="button">Connect an ATS source</button><button onClick={() => { setAddJobMode("manual"); setActiveView("add"); }} type="button">Add a job manually</button></div></section>}
        </section>
      </section>}

      {activeView === "analytics" && <section className="admin-analytics" aria-labelledby="admin-analytics-title">
        <header>
          <div><span className="eyebrow">Last 30 days</span><h2 id="admin-analytics-title">Understand what people use</h2><p>Privacy-safe product activity, without salary figures, deductions, payslip values, passwords or form text.</p></div>
          <span className="admin-analytics-setup">First-party analytics</span>
        </header>
        {productAnalytics ? <>
          <div className="admin-analytics-cards">
            <article><strong>{productAnalytics.accounts_total.toLocaleString()}</strong><span>Total accounts</span><small>{productAnalytics.accounts_30d.toLocaleString()} created in 30 days</small></article>
            {analyticsCards.map(([event, label]) => {
              const current = productAnalytics.totals[event] ?? 0;
              const previous = productAnalytics.previous[event] ?? 0;
              const change = previous ? Math.round(((current - previous) / previous) * 100) : null;
              return <article key={event}><strong>{current.toLocaleString()}</strong><span>{label}</span><small>{change === null ? "No previous baseline" : `${change >= 0 ? "+" : ""}${change}% from prior 30 days`}</small></article>;
            })}
          </div>
          <div className="admin-analytics-details">
            <section><h3>14-day activity</h3><div className="admin-analytics-bars" aria-label="Daily page views">
              {productAnalytics.daily.map((day) => {
                const max = Math.max(1, ...productAnalytics.daily.map((item) => item.page_views));
                return <span key={day.date} title={`${day.date}: ${day.page_views} page views`}><i style={{ height: `${Math.max(6, (day.page_views / max) * 100)}%` }} /><small>{day.date.slice(5)}</small></span>;
              })}
            </div></section>
            <section><h3>Most visited pages</h3>{productAnalytics.top_pages.length ? <ol>{productAnalytics.top_pages.map((item) => <li key={item.path}><span>{item.path}</span><strong>{item.views.toLocaleString()}</strong></li>)}</ol> : <p>No page views recorded yet.</p>}</section>
            <section><h3>Traffic sources</h3>{productAnalytics.referrers.length ? <ol>{productAnalytics.referrers.map((item) => <li key={item.source}><span>{item.source}</span><strong>{item.views.toLocaleString()}</strong></li>)}</ol> : <p>No referral data recorded yet.</p>}</section>
          </div>
        </> : <div className="admin-analytics-empty"><strong>Detailed analytics are not live yet.</strong><p>The operational summary above is available now. Detailed privacy-safe trends will appear here once enough activity has been recorded.</p></div>}
      </section>}

      <section className={`admin-section ${activeView === "add" ? "" : "admin-view-hidden"}`}>
        <div className="admin-add-heading"><span className="eyebrow">Add jobs</span><h2>Choose the simplest path.</h2><p>Start with the source. SalarySabi will keep every listing in review until its evidence is checked.</p></div>
        <div className="admin-add-paths" role="tablist" aria-label="Choose how to add jobs">
          <button aria-selected={addJobMode === "source"} className={addJobMode === "source" ? "is-active" : ""} onClick={() => setAddJobMode("source")} role="tab" type="button"><strong>Start with a job URL</strong><span>Best for one published listing</span></button>
          <button aria-selected={addJobMode === "manual"} className={addJobMode === "manual" ? "is-active" : ""} onClick={() => setAddJobMode("manual")} role="tab" type="button"><strong>Add manually</strong><span>Enter every verified detail</span></button>
          <button aria-selected={addJobMode === "ats"} className={addJobMode === "ats" ? "is-active" : ""} onClick={() => setAddJobMode("ats")} role="tab" type="button"><strong>Connect an ATS</strong><span>Import salary-bearing jobs as drafts</span></button>
        </div>

        {addJobMode === "source" && <form className="admin-source-first" onSubmit={(event) => { event.preventDefault(); setAddJobMode("manual"); }}>
          <div><span className="eyebrow">Recommended</span><h3>Paste the job URL.</h3><p>We will carry the source into the review form. Add only the facts you can verify on that page.</p></div>
          <label>Original job URL<input autoFocus onChange={(event) => setSourceUrlDraft(event.target.value)} placeholder="https://company.com/careers/role" type="url" value={sourceUrlDraft} required /></label>
          <button className="primary-button" type="submit">Continue with this source</button>
        </form>}

        {addJobMode === "manual" && <form
          className="moderation-card admin-job-editor"
          onSubmit={createOfficialJob}
        >
          <div className="job-form-grid">
            <label>
              Job title
              <input name="title" required />
            </label>
            <label>
              Company
              <input name="company_name" required />
            </label>
            <label>
              Location
              <input name="location" required />
            </label>
            <label>
              Work arrangement
              <select name="work_mode">
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </label>
            <label>
              Employment type
              <select name="employment_type">
                <option>Full time</option>
                <option>Part time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </label>
            <label>
              Engagement
              <select name="engagement_type">
                <option value="employee">Employee</option>
                <option value="contractor">Independent contractor</option>
                <option value="unknown">Not confirmed</option>
              </select>
            </label>
            <label>
              Currency
              <select name="salary_currency">
                <option>NGN</option>
                <option>USD</option>
                <option>GBP</option>
                <option>EUR</option>
              </select>
            </label>
            <label>
              Salary basis
              <select name="salary_type">
                <option value="gross">Gross</option>
                <option value="net">Net</option>
                <option value="not_stated">Not stated by employer</option>
              </select>
            </label>
            <label>
              Salary evidence
              <select name="salary_source">
                <option value="employer_disclosed">Employer disclosed</option>
                <option value="source_reported">Third-party source reported</option>
              </select>
            </label>
            <label>
              Minimum salary
              <input name="salary_min" type="number" min="1" required />
            </label>
            <label>
              Maximum salary
              <input name="salary_max" type="number" min="1" required />
            </label>
            <label>
              Salary period
              <select name="salary_period">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </label>
            <label>
              Deadline status
              <select name="deadline_status">
                <option value="employer_provided">Employer provided</option>
                <option value="verified">Verified directly</option>
                <option value="unknown">Not provided</option>
                <option value="rolling">Rolling applications</option>
                <option value="estimated">Estimated</option>
              </select>
            </label>
            <label>
              Deadline or internal review-by date
              <input name="expires_at" type="date" required />
            </label>
            <label className="wide">
              Source URL
              <input defaultValue={sourceUrlDraft} name="source_url" type="url" required />
            </label>
            <label>
              Source type
              <select name="source_kind">
                <option value="official_page">Official employer page</option>
                <option value="community_tip">Third-party listing</option>
              </select>
            </label>
            <label>
              Source name
              <input name="source_name" placeholder="Employer careers, Indeed, recruiter" required />
            </label>
            <label className="wide">
              Direct application URL, if different
              <input name="application_url" type="url" />
            </label>
            <label>
              Verification state
              <select name="verification_status">
                <option value="pending">Verification pending</option>
                <option value="verified">Verified directly</option>
                <option value="unverified">Could not verify</option>
              </select>
            </label>
            <label className="wide">
              SalarySabi-written summary
              <textarea
                name="description"
                minLength={80}
                maxLength={1500}
                rows={6}
                required
              />
            </label>
            <label className="admin-check wide">
              <input name="global_remote" type="checkbox" />
              Available globally, not restricted to Nigeria
            </label>
            <fieldset className="wide">
              <legend>Transparency evidence</legend>
              <label className="admin-check"><input name="employer_named" type="checkbox" defaultChecked />Hiring employer or client is named</label>
              <label className="admin-check"><input name="role_specific" type="checkbox" />Responsibilities and requirements are specific</label>
              <label className="admin-check"><input name="company_application" type="checkbox" />Application uses an employer-controlled domain</label>
              <label className="admin-check"><input name="contradictory_or_templated" type="checkbox" />Description is contradictory or templated (−20)</label>
              <label className="admin-check"><input name="identity_unverifiable" type="checkbox" />Employer identity cannot be verified (−30)</label>
            </fieldset>
            <label className="wide">
              Public transparency notes, one per line
              <textarea name="transparency_notes" maxLength={1200} rows={5} placeholder="No application deadline was provided.&#10;Recruiter client is not named." />
            </label>
          </div>
          <div className="moderation-actions">
            <button disabled={busy === "official-job"} value="draft">Save review draft</button>
            <button className="primary-button" disabled={busy === "official-job"} value="publish">Publish checked listing</button>
          </div>
        </form>}
        {addJobMode === "ats" && <section className="admin-import-sources" aria-labelledby="import-sources-title">
          <h2 id="import-sources-title">Connect an ATS source</h2>
          <p>Add the public board key from an employer&apos;s Greenhouse or Lever careers URL. Imports remain drafts until you verify salary and application evidence.</p>
          <form className="admin-import-source-form" onSubmit={createImportSource}>
            <label>Provider<select name="provider" required><option value="greenhouse">Greenhouse</option><option value="lever">Lever</option></select></label>
            <label>Employer name<input name="company_name" minLength={2} placeholder="e.g. Flutterwave" required /></label>
            <label>Board URL or key<input name="source_key" minLength={2} onInput={event => event.currentTarget.setCustomValidity("")} placeholder="e.g. boards.greenhouse.io/company" required /></label>
            <button className="primary-button" disabled={busy === "import-source"}>Add source</button>
          </form>
          <div className="moderation-list">
            {importSources.map(source => (
              <article className="moderation-card admin-import-source-card" key={source.id}>
                {editingImportSourceId === source.id ? (
                  <form className="admin-import-source-edit-form" onSubmit={event => void updateImportSource(event, source)}>
                    <label>Provider<select defaultValue={source.provider} name="provider" required><option value="greenhouse">Greenhouse</option><option value="lever">Lever</option></select></label>
                    <label>Employer name<input defaultValue={source.company_name} name="company_name" minLength={2} required /></label>
                    <label>Board URL or key<input defaultValue={source.source_key} name="source_key" minLength={2} onInput={event => event.currentTarget.setCustomValidity("")} required /></label>
                    <div className="admin-import-source-edit-actions"><button disabled={busy === `edit-source-${source.id}`} type="submit">{busy === `edit-source-${source.id}` ? "Saving…" : "Save changes"}</button><button disabled={busy === `edit-source-${source.id}`} onClick={() => setEditingImportSourceId("")} type="button">Cancel</button></div>
                  </form>
                ) : (
                  <>
                    <div className="admin-import-source-copy"><strong>{source.company_name}</strong><span>{source.provider} · {source.source_key}</span><small>{source.last_sync_at ? `${source.last_sync_status || "checked"} · ${source.last_sync_at.slice(0,10)}${source.last_sync_message ? ` · ${source.last_sync_message}` : ""}` : "Waiting for first scheduled import"}</small></div>
                    <div className="admin-import-source-actions"><button aria-label={`Test and import ${source.company_name} ATS source now`} className="admin-test-source" disabled={busy !== null} onClick={() => void runImportSource(source)} type="button">{busy === `import-source-${source.id}` ? "Checking…" : "Test & import now"}</button><button aria-label={`Edit ${source.company_name} ATS source`} className="admin-edit-source" disabled={busy !== null} onClick={() => setEditingImportSourceId(source.id)} type="button">Edit</button><button aria-label={`Remove ${source.company_name} ATS source`} className="admin-remove-source" disabled={busy !== null} onClick={() => void deleteImportSource(source)} type="button">{busy === `delete-source-${source.id}` ? "Removing…" : "Remove"}</button></div>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>}
      </section>

      <section className="admin-section admin-view-hidden">
        <h2>Pending submissions</h2>
        {!submissions.length && <p>No pending submissions.</p>}
        <div className="moderation-list">
          {submissions.map((item) => (
            <article className="moderation-card" key={item.id}>
              <div>
                <span>{item.company_name}</span>
                <h3>{item.title}</h3>
                <p>
                  {item.location} · {item.work_mode} · {item.employment_type}
                </p>
              </div>
              <dl>
                <div>
                  <dt>Salary</dt>
                  <dd>{formatJobSalary(item)}</dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>{item.contact_email}</dd>
                </div>
                <div>
                  <dt>Deadline</dt>
                  <dd>{item.expires_at}</dd>
                </div>
                <div>
                  <dt>Submitted by</dt>
                  <dd>{item.submitter_type === "recruiter" ? `${item.recruiter_company} for ${item.client_display_name}` : "Direct employer"}</dd>
                </div>
                <div>
                  <dt>Checks declared</dt>
                  <dd>{item.no_candidate_fees_confirmed ? "No candidate fees" : "Candidate-fee declaration missing"}{item.submitter_type === "recruiter" ? item.authority_confirmed ? "; written authority confirmed" : "; authority missing" : ""}</dd>
                </div>
              </dl>
              <details>
                <summary>Read submitted description</summary>
                <p>{item.description}</p>
              </details>
              <a
                href={item.application_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Check application link
                <ExternalLinkIcon />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <div className="moderation-actions">
                <button
                  disabled={busy === item.id}
                  type="button"
                  onClick={() => review(item.id, "reject_job_submission")}
                >
                  Reject
                </button>
                <button
                  disabled={busy === item.id}
                  className="primary-button"
                  type="button"
                  onClick={() => review(item.id, "approve_verified_job_submission")}
                >
                  Approve and publish
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`admin-section ${activeView === "review" ? "admin-review-suggestions" : "admin-view-hidden"}`}>
        <h2>Community job suggestions</h2>
        {!suggestions.length && <p>No pending suggestions.</p>}
        <div className="moderation-list">
          {suggestions.map((item) => (
            <article className="moderation-card" key={item.id}>
              <div>
                <span>{item.company_name}</span>
                <h3>{item.advertised_salary}</h3>
              </div>
              <p>{item.notes || "No notes supplied."}</p>
              <a
                href={item.official_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Check official listing
                <ExternalLinkIcon />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <div className="moderation-actions">
                <button
                  disabled={busy === item.id}
                  onClick={() => reviewSuggestion(item.id, "rejected")}
                >
                  Reject
                </button>
                <button
                  className="primary-button"
                  disabled={busy === item.id}
                  onClick={() => reviewSuggestion(item.id, "reviewed")}
                >
                  Mark reviewed
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`admin-jobs-workspace ${activeView === "jobs" ? "" : "admin-view-hidden"}`} aria-labelledby="manage-jobs-title">
        <header className="admin-jobs-header">
          <div><span className="eyebrow">Job management</span><h2 id="manage-jobs-title">Manage every listing</h2><p>Filter by lifecycle, open one job, then take the action you need.</p></div>
          <div className="admin-job-lifecycle-tabs" role="tablist" aria-label="Filter jobs by status">
            {(Object.keys(jobLifecycleLabels) as JobLifecycle[]).map((lifecycle) => <button aria-selected={jobLifecycleFilter === lifecycle} className={jobLifecycleFilter === lifecycle ? "is-active" : ""} key={lifecycle} onClick={() => { setJobLifecycleFilter(lifecycle); setSelectedManagedJobId(""); setSelectedExpiredJobIds([]); setDeleteConfirmJobId(""); setDeleteConfirmation(""); }} role="tab" type="button"><span>{jobLifecycleLabels[lifecycle]}</span><strong>{lifecycleCounts[lifecycle]}</strong></button>)}
          </div>
        </header>

        <div className="admin-job-management">
          <aside className="admin-job-list" aria-label={`${jobLifecycleLabels[jobLifecycleFilter]} jobs`}>
            <header><div><strong>{jobLifecycleLabels[jobLifecycleFilter]}</strong><span>{managedJobs.length} {managedJobs.length === 1 ? "job" : "jobs"}</span></div>{jobLifecycleFilter === "expired" && managedJobs.length > 0 && <label><input checked={selectedExpiredJobIds.length === managedJobs.length} onChange={(event) => setSelectedExpiredJobIds(event.target.checked ? managedJobs.map((job) => job.id) : [])} type="checkbox" />Select all</label>}</header>
            {jobLifecycleFilter === "expired" && selectedExpiredJobIds.length > 0 && <div className="admin-job-bulk-bar"><span>{selectedExpiredJobIds.length} selected</span><button disabled={busy === "bulk-archive"} onClick={() => void archiveSelectedExpiredJobs()} type="button">{busy === "bulk-archive" ? "Archiving…" : "Archive selected"}</button></div>}
            {managedJobs.length ? managedJobs.map((job) => {
              const lifecycle = getJobLifecycle(job, today);
              return <article className={job.id === effectiveManagedJobId ? "is-selected" : ""} key={job.id}>
                {jobLifecycleFilter === "expired" && <label className="admin-job-select"><input aria-label={`Select ${job.title}`} checked={selectedExpiredJobIds.includes(job.id)} onChange={(event) => setSelectedExpiredJobIds((current) => event.target.checked ? [...current, job.id] : current.filter((id) => id !== job.id))} type="checkbox" /></label>}
                <button onClick={() => { setSelectedManagedJobId(job.id); setDeleteConfirmJobId(""); setDeleteConfirmation(""); }} type="button"><span><strong>{job.title}</strong><small>{job.company_name}</small></span><span className={`admin-job-status status-${lifecycle}`}>{jobLifecycleLabels[lifecycle]}</span><small>{job.location} · closes {new Date(`${job.expires_at}T12:00:00`).toLocaleDateString("en-NG", { dateStyle: "medium" })}</small><b>{formatJobSalary(job)}</b></button>
              </article>;
            }) : <div className="admin-job-list-empty"><strong>No {jobLifecycleLabels[jobLifecycleFilter].toLowerCase()} jobs.</strong><p>Choose another status or add a new listing.</p></div>}
          </aside>

          <section className="admin-job-detail">
            {selectedManagedJob ? <>
              <header><div><span className={`admin-job-status status-${getJobLifecycle(selectedManagedJob, today)}`}>{jobLifecycleLabels[getJobLifecycle(selectedManagedJob, today)]}</span><h3>{selectedManagedJob.title}</h3><p>{selectedManagedJob.company_name} · {selectedManagedJob.location}</p></div><strong>{formatJobSalary(selectedManagedJob)}</strong></header>
              <div className="admin-job-lifecycle-actions">
                {getJobLifecycle(selectedManagedJob, today) === "live" && <><Link className="admin-primary-action" href={`/jobs/${selectedManagedJob.slug}`} target="_blank">View live job <ExternalLinkIcon /></Link><button disabled={busy === selectedManagedJob.id} onClick={() => void setJobStatus(selectedManagedJob.id, "filled")} type="button">Mark filled</button></>}
                {getJobLifecycle(selectedManagedJob, today) === "review" && <button className="admin-primary-action" onClick={() => { setSelectedReviewId(selectedManagedJob.id); setActiveView("review"); }} type="button">Open review checklist</button>}
                {getJobLifecycle(selectedManagedJob, today) === "expired" && <><button className="admin-primary-action" disabled={busy === selectedManagedJob.id} onClick={() => void setJobStatus(selectedManagedJob.id, "published")} type="button">Republish</button><button disabled={busy === selectedManagedJob.id} onClick={() => void setJobStatus(selectedManagedJob.id, "filled")} type="button">Mark filled</button></>}
                {getJobLifecycle(selectedManagedJob, today) === "archived" && <button className="admin-primary-action" disabled={busy === selectedManagedJob.id} onClick={() => void setJobStatus(selectedManagedJob.id, "draft")} type="button">Restore to review</button>}
                {getJobLifecycle(selectedManagedJob, today) !== "review" && <details className="admin-job-more-actions">
                  <summary>More</summary>
                  <div>
                    {getJobLifecycle(selectedManagedJob, today) === "live" && <button disabled={busy === selectedManagedJob.id} onClick={() => void setJobStatus(selectedManagedJob.id, "expired")} type="button">Expire</button>}
                    {getJobLifecycle(selectedManagedJob, today) !== "archived" && <button disabled={busy === selectedManagedJob.id} onClick={() => void setJobStatus(selectedManagedJob.id, "archived")} type="button">Archive</button>}
                    {["expired", "filled", "archived"].includes(getJobLifecycle(selectedManagedJob, today)) && <button className="admin-danger-link" onClick={() => { setDeleteConfirmJobId(selectedManagedJob.id); setDeleteConfirmation(""); }} type="button">Delete permanently</button>}
                  </div>
                </details>}
              </div>

              <form className="admin-managed-job-form" key={selectedManagedJob.id} onSubmit={(event) => saveJob(event, selectedManagedJob.id)}>
                <div className="admin-managed-job-heading"><div><span className="eyebrow">Listing details</span><h4>Edit the essentials</h4></div><button className="primary-button" disabled={busy === selectedManagedJob.id}>Save changes</button></div>
                <div className="job-form-grid">
                  <label>Title<input name="title" defaultValue={selectedManagedJob.title} required /></label>
                  <label>Company<input name="company_name" defaultValue={selectedManagedJob.company_name} required /></label>
                  <label>Location<input name="location" defaultValue={selectedManagedJob.location} required /></label>
                  <label>Deadline<input name="expires_at" type="date" defaultValue={selectedManagedJob.expires_at} required /></label>
                  <label>Minimum salary<input name="salary_min" type="number" min="1" defaultValue={selectedManagedJob.salary_min} required /></label>
                  <label>Maximum salary<input name="salary_max" type="number" min="1" defaultValue={selectedManagedJob.salary_max} required /></label>
                  <label>Salary period<select name="salary_period" defaultValue={selectedManagedJob.salary_period}><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label>
                  <label>Salary type<select name="salary_type" defaultValue={selectedManagedJob.salary_type}><option value="gross">Gross</option><option value="net">Net</option><option value="not_stated">Not stated by employer</option></select></label>
                  <label className="wide">Application link<input name="application_url" type="url" defaultValue={selectedManagedJob.application_url} required /></label>
                </div>
                <details className="admin-managed-job-more"><summary>More listing and source details</summary><div className="job-form-grid">
                  <label>Work arrangement<select name="work_mode" defaultValue={selectedManagedJob.work_mode}><option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></label>
                  <label>Employment type<select name="employment_type" defaultValue={selectedManagedJob.employment_type}><option>Full time</option><option>Part time</option><option>Contract</option><option>Internship</option></select></label>
                  <label>Currency<select name="salary_currency" defaultValue={selectedManagedJob.salary_currency}><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option></select></label>
                  <label>Salary evidence<select name="salary_source" defaultValue={selectedManagedJob.salary_source}><option value="employer_disclosed">Employer disclosed</option><option value="source_reported">Source reported</option><option value="third_party_estimate">Third-party estimate</option></select></label>
                  <label>Engagement<select name="engagement_type" defaultValue={selectedManagedJob.engagement_type}><option value="employee">Employee</option><option value="contractor">Independent contractor</option><option value="unknown">Not confirmed</option></select></label>
                  <label>Verification source<select name="source_kind" defaultValue={selectedManagedJob.source_kind}><option value="employer_submission">Employer submission</option><option value="official_page">Official employer page</option><option value="licensed_feed">Licensed feed</option><option value="community_tip">Community tip checked against official page</option></select></label>
                  <label>Source name<input name="source_name" defaultValue={selectedManagedJob.source_name || ""} /></label>
                  <label className="wide">Source link<input name="source_url" type="url" defaultValue={selectedManagedJob.source_url || ""} /></label>
                  <label className="wide">Canonical link<input name="canonical_url" type="url" defaultValue={selectedManagedJob.canonical_url || ""} /></label>
                  <label className="wide">Description<textarea name="description" defaultValue={selectedManagedJob.description} rows={7} required /></label>
                  <label className="admin-check wide"><input name="employer_verified" type="checkbox" defaultChecked={selectedManagedJob.employer_verified} />Employer identity verified</label>
                  <label className="admin-check wide"><input name="global_remote" type="checkbox" defaultChecked={selectedManagedJob.global_remote} />Available globally, not restricted to Nigeria</label>
                </div></details>
              </form>

              {deleteConfirmJobId === selectedManagedJob.id && <section className="admin-delete-confirmation" role="alert"><div><span className="eyebrow">Permanent deletion</span><h4>Delete this job and its related records?</h4><p>This cannot be undone. Saved-job references, tracked applications, reports and notification history for this listing will also be removed.</p></div><label>Type <strong>{selectedManagedJob.title}</strong> to confirm<input autoFocus value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /></label><div><button onClick={() => { setDeleteConfirmJobId(""); setDeleteConfirmation(""); }} type="button">Cancel</button><button className="danger-button" disabled={deleteConfirmation !== selectedManagedJob.title || busy === `delete-job-${selectedManagedJob.id}`} onClick={() => void deleteJobPermanently(selectedManagedJob)} type="button">{busy === `delete-job-${selectedManagedJob.id}` ? "Deleting…" : "Delete permanently"}</button></div></section>}
            </> : <div className="admin-job-detail-empty"><strong>Nothing to manage here.</strong><p>Select a different lifecycle status to continue.</p></div>}
          </section>
        </div>
      </section>

      <section className={`admin-section ${activeView === "reports" ? "" : "admin-view-hidden"}`}>
        <div className="admin-reports-heading"><span className="eyebrow">Trust and safety</span><h2>Open job reports</h2></div>
        {!reports.length && <section className="admin-reports-clear"><strong>No open reports.</strong><p>All published jobs are clear. Reports are checked whenever this workspace loads.</p><button onClick={() => { setJobLifecycleFilter("live"); setActiveView("jobs"); }} type="button">View published jobs</button></section>}
        <div className="moderation-list">
          {reports.map((report) => (
            <article className="moderation-card" key={report.id}>
              <strong>{report.reason.replaceAll("_", " ")}</strong>
              <p>{report.details || "No additional details."}</p>
              <small>
                Job ID: {report.job_id}
                {report.reporter_email ? ` · ${report.reporter_email}` : ""}
              </small>
              <div className="moderation-actions">
                <button
                  disabled={busy === report.id}
                  onClick={() => closeReport(report.id, "dismissed")}
                >
                  Dismiss
                </button>
                <button
                  className="primary-button"
                  disabled={busy === report.id}
                  onClick={() => closeReport(report.id, "reviewed")}
                >
                  Mark reviewed
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
