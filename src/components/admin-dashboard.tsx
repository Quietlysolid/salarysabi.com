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

const analyticsCards = [
  ["page_view", "Page views"],
  ["paye_calculated", "PAYE calculations"],
  ["payslip_checked", "Payslip checks"],
  ["job_apply_clicked", "Apply clicks"],
  ["job_alert_created", "Alerts created"],
  ["job_submission_succeeded", "Jobs submitted"],
] as const;

const adminFixtureJobs: Job[] = [
  { id: "fixture-1", slug: "senior-devops-engineer-flutterwave", title: "Senior DevOps Engineer", company_name: "Flutterwave Technology Solutions", location: "Lagos, Nigeria", work_mode: "hybrid", employment_type: "Full time", description: "Lead platform reliability work across cloud infrastructure and deployment systems for a growing payments team.", salary_min: 700000, salary_max: 1000000, salary_period: "monthly", salary_type: "gross", salary_currency: "NGN", salary_source: "employer_disclosed", application_url: "https://example.com/jobs/devops", source_url: "https://example.com/jobs/devops", employer_verified: false, source_verified_at: "2026-08-08T10:15:00Z", published_at: "2026-08-08T10:15:00Z", expires_at: "2026-08-15", source_kind: "official_page", source_name: "Flutterwave careers", source_job_id: "fixture-source-1", canonical_url: "https://example.com/jobs/devops", source_last_seen_at: "2026-08-08T10:15:00Z", global_remote: false, engagement_type: "employee", status: "draft" },
  { id: "fixture-2", slug: "financial-controller-dangote", title: "Financial Controller", company_name: "Dangote Cement Plc", location: "Lagos, Nigeria", work_mode: "onsite", employment_type: "Full time", description: "Own financial controls, reporting and compliance for a large operating business in Lagos.", salary_min: 850000, salary_max: 1100000, salary_period: "monthly", salary_type: "gross", salary_currency: "NGN", salary_source: "source_reported", application_url: "https://example.com/jobs/controller", source_url: "https://example.com/jobs/controller", employer_verified: false, source_verified_at: "2026-08-07T09:00:00Z", published_at: "2026-08-07T09:00:00Z", expires_at: "2026-08-20", source_kind: "community_tip", source_name: "Official vacancy notice", source_job_id: "fixture-source-2", canonical_url: "https://example.com/jobs/controller", source_last_seen_at: "2026-08-07T09:00:00Z", global_remote: false, engagement_type: "employee", status: "draft" },
  { id: "fixture-3", slug: "data-analyst-kuda", title: "Data Analyst", company_name: "Kuda Technologies", location: "Remote, Nigeria", work_mode: "remote", employment_type: "Full time", description: "Build reporting and analysis that helps product teams understand customer behaviour and business performance.", salary_min: 600000, salary_max: 800000, salary_period: "monthly", salary_type: "gross", salary_currency: "NGN", salary_source: "employer_disclosed", application_url: "https://example.com/jobs/analyst", source_url: "https://example.com/jobs/analyst", employer_verified: false, source_verified_at: "2026-08-06T12:00:00Z", published_at: "2026-08-06T12:00:00Z", expires_at: "2026-08-18", source_kind: "official_page", source_name: "Kuda careers", source_job_id: "fixture-source-3", canonical_url: "https://example.com/jobs/analyst", source_last_seen_at: "2026-08-06T12:00:00Z", global_remote: false, engagement_type: "employee", status: "draft" },
];

export function AdminDashboard({ fixtureMode = false }: { fixtureMode?: boolean }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(() => fixtureMode ? ({ user: { email: "ozichi@salarysabi.com" } } as unknown as Session) : null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reports, setReports] = useState<JobReport[]>([]);
  const [suggestions, setSuggestions] = useState<JobSuggestion[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"checking" | "ready" | "error">(() => fixtureMode ? "ready" : "checking");
  const [dashboardStatus, setDashboardStatus] = useState<"idle" | "loading" | "ready" | "error" | "forbidden">("idle");
  const [activeView, setActiveView] = useState<"review" | "jobs" | "reports" | "analytics" | "add">("review");
  const [selectedReviewId, setSelectedReviewId] = useState("");

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

  const loadDashboard = useCallback(async () => {
    setDashboardStatus("loading");
    setMessage("");
    if (fixtureMode) {
      setJobs(adminFixtureJobs);
      setSubmissions([]);
      setSuggestions([]);
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
    action: "approve_job_submission" | "reject_job_submission",
  ) {
    setBusy(id);
    const { error } = await supabase.rpc(action, { p_submission_id: id });
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
    const { error } = await supabase.from("jobs").update(changes).eq("id", id);
    setMessage(error ? error.message : "Job updated.");
    if (!error) await loadDashboard();
    setBusy(null);
  }

  async function saveReviewJob(event: FormEvent<HTMLFormElement>, job: Job, publish: boolean) {
    event.preventDefault();
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
      source_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    setMessage(error ? error.message : publish ? "Job checked and published." : "Draft saved.");
    if (!error) await loadDashboard();
    setBusy(null);
  }

  async function setJobStatus(
    id: string,
    status: "published" | "expired" | "filled",
  ) {
    setBusy(id);
    const { error } = await supabase
      .from("jobs")
      .update({
        status,
        filled_at: status === "filled" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setMessage(
      error
        ? error.message
        : status === "published"
          ? "Job republished."
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
        verification_status: data.get("verification_status"),
        status: publish ? "published" : "draft",
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
          <Link aria-label="SalarySabi home" className="brand" href="/"><BrandMark /><BrandWordmark /></Link>
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
  const reviewQueue = [
    ...draftJobs.map((job) => ({ id: job.id, kind: "draft" as const, title: job.title, company: job.company_name, location: job.location, salary: formatJobSalary(job) })),
    ...submissions.map((item) => ({ id: item.id, kind: "submission" as const, title: item.title, company: item.company_name, location: item.location, salary: formatJobSalary(item) })),
  ];
  const effectiveReviewId = selectedReviewId || reviewQueue[0]?.id || "";
  const selectedDraft = draftJobs.find((job) => job.id === effectiveReviewId);
  const selectedSubmission = submissions.find((item) => item.id === effectiveReviewId);

  return (
    <section className="admin-shell">
      <header className="admin-topbar">
        <Link aria-label="SalarySabi home" className="brand" href="/"><BrandMark /><BrandWordmark /></Link>
        <nav aria-label="Administration sections">
          {([['review', 'Review'], ['jobs', 'Published'], ['reports', 'Reports'], ['analytics', 'Analytics']] as const).map(([view, label]) => (
            <button aria-current={activeView === view ? "page" : undefined} className={activeView === view ? "is-active" : ""} key={view} onClick={() => setActiveView(view)} type="button">{label}{view === "review" && reviewQueue.length ? <span>{reviewQueue.length}</span> : null}</button>
          ))}
        </nav>
        <div className="admin-topbar-actions"><span>{session.user.email}</span><button className="admin-add-job" onClick={() => setActiveView("add")} type="button">Add job</button><button type="button" onClick={() => supabase.auth.signOut()}>Sign out</button></div>
      </header>
      <div className={`admin-dashboard-status is-${dashboardStatus}`} role="status">
        <span>{dashboardStatus === "loading" ? "Loading the latest administration data..." : message}</span>
        {dashboardStatus === "error" && <button type="button" onClick={() => void loadDashboard()}>Try again</button>}
        {dashboardStatus === "forbidden" && <button type="button" onClick={() => supabase.auth.signOut()}>Use another account</button>}
      </div>
      {activeView === "analytics" && metrics && (
        <section className="admin-metrics" aria-label="Job platform report">
          {Object.entries(metrics).map(([label, value]) => (
            <div key={label}>
              <strong>{Number(value).toLocaleString()}</strong>
              <span>{label.replaceAll("_", " ")}</span>
            </div>
          ))}
        </section>
      )}

      {activeView === "review" && <section className="admin-review-workspace" aria-labelledby="review-title">
        <aside className="admin-review-queue">
          <header><div><span className="eyebrow">Review queue</span><strong>{reviewQueue.length}</strong></div><small>Oldest first</small></header>
          {reviewQueue.length ? reviewQueue.map((item) => <button className={item.id === effectiveReviewId ? "is-selected" : ""} key={`${item.kind}-${item.id}`} onClick={() => setSelectedReviewId(item.id)} type="button"><strong>{item.title}</strong><span>{item.company}</span><small>{item.location} · {item.salary}</small></button>) : <div className="admin-review-empty"><strong>Queue clear.</strong><p>No jobs need review right now.</p></div>}
        </aside>
        <section className="admin-review-canvas">
          <header><div><span className="eyebrow">Reviewing</span><h1 id="review-title">{selectedDraft?.title || selectedSubmission?.title || "Nothing waiting"}</h1><p>{selectedDraft?.company_name || selectedSubmission?.company_name || "New submissions and imported jobs will appear here."}</p></div>{(selectedDraft || selectedSubmission) && <strong className="admin-review-salary">{formatJobSalary((selectedDraft || selectedSubmission)!)}</strong>}</header>
          {selectedDraft && <form onSubmit={(event) => {
            const submitter = (event.nativeEvent as SubmitEvent).submitter;
            void saveReviewJob(event, selectedDraft, submitter instanceof HTMLButtonElement && submitter.value === "publish");
          }}>
            <section className="admin-evidence"><h2>Evidence checks</h2><div><span className={selectedDraft.source_url ? "is-good" : "is-warning"}><strong>Official source</strong><small>{selectedDraft.source_url ? "Source link supplied" : "Source link missing"}</small></span><span className={selectedDraft.salary_min > 0 ? "is-good" : "is-warning"}><strong>Exact pay stated</strong><small>{formatJobSalary(selectedDraft)}</small></span><span className={new Date(selectedDraft.expires_at) >= new Date() ? "is-good" : "is-warning"}><strong>Vacancy still open</strong><small>Deadline {selectedDraft.expires_at}</small></span></div></section>
            <section className="admin-review-compare"><div className="admin-source-facts"><span className="eyebrow">Source facts</span><dl><div><dt>Source</dt><dd>{selectedDraft.source_name || "Not named"}</dd></div><div><dt>Source type</dt><dd>{selectedDraft.source_kind.replaceAll('_', ' ')}</dd></div><div><dt>Salary evidence</dt><dd>{selectedDraft.salary_source.replaceAll('_', ' ')}</dd></div><div><dt>Last checked</dt><dd>{selectedDraft.source_last_seen_at?.slice(0, 10) || selectedDraft.source_verified_at.slice(0, 10)}</dd></div></dl>{selectedDraft.source_url && <a href={selectedDraft.source_url} rel="noopener noreferrer" target="_blank">Open original source <ExternalLinkIcon /></a>}</div><div className="admin-review-fields"><span className="eyebrow">SalarySabi fields</span><div className="job-form-grid"><label>Job title<input name="title" defaultValue={selectedDraft.title} required /></label><label>Company<input name="company_name" defaultValue={selectedDraft.company_name} required /></label><label>Location<input name="location" defaultValue={selectedDraft.location} required /></label><label>Deadline<input name="expires_at" type="date" defaultValue={selectedDraft.expires_at} required /></label><label>Minimum salary<input name="salary_min" type="number" min="1" defaultValue={selectedDraft.salary_min} required /></label><label>Maximum salary<input name="salary_max" type="number" min="1" defaultValue={selectedDraft.salary_max} required /></label><label>Salary period<select name="salary_period" defaultValue={selectedDraft.salary_period}><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label></div></div></section>
            <footer className="admin-review-actions"><button disabled={busy === selectedDraft.id} onClick={() => void setJobStatus(selectedDraft.id, "expired")} type="button">Reject job</button><button disabled={busy === selectedDraft.id} value="draft">Save draft</button><button className="primary-button" disabled={busy === selectedDraft.id} value="publish">Publish job</button></footer>
          </form>}
          {selectedSubmission && <div className="admin-submission-review"><section className="admin-evidence"><h2>Evidence checks</h2><div><span className="is-good"><strong>Employer submission</strong><small>{selectedSubmission.contact_email}</small></span><span className={selectedSubmission.no_candidate_fees_confirmed ? "is-good" : "is-warning"}><strong>No candidate fees</strong><small>{selectedSubmission.no_candidate_fees_confirmed ? "Confirmed" : "Confirmation missing"}</small></span><span className={new Date(selectedSubmission.expires_at) >= new Date() ? "is-good" : "is-warning"}><strong>Vacancy still open</strong><small>Deadline {selectedSubmission.expires_at}</small></span></div></section><div className="admin-submission-copy"><p>{selectedSubmission.description}</p><a href={selectedSubmission.application_url} rel="noopener noreferrer" target="_blank">Check application link <ExternalLinkIcon /></a></div><footer className="admin-review-actions"><button disabled={busy === selectedSubmission.id} onClick={() => review(selectedSubmission.id, "reject_job_submission")} type="button">Reject job</button><button className="primary-button" disabled={busy === selectedSubmission.id} onClick={() => review(selectedSubmission.id, "approve_job_submission")} type="button">Approve and publish</button></footer></div>}
        </section>
      </section>}

      {activeView === "analytics" && <section className="admin-analytics" aria-labelledby="admin-analytics-title">
        <header>
          <div><span className="eyebrow">Last 30 days</span><h2 id="admin-analytics-title">Product analytics</h2><p>First-party counts exclude salary figures, deductions, payslip values, passwords and form text.</p></div>
          {process.env.NEXT_PUBLIC_POSTHOG_DASHBOARD_URL
            ? <a href={process.env.NEXT_PUBLIC_POSTHOG_DASHBOARD_URL} rel="noreferrer" target="_blank">Open detailed PostHog reports <ExternalLinkIcon /></a>
            : <span className="admin-analytics-setup">PostHog awaits local environment keys</span>}
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
        </> : <div className="admin-analytics-empty"><strong>Analytics summary is ready for its database migration.</strong><p>Apply the new local migration to preview real first-party counts. Event collection remains safe when this panel is unavailable.</p></div>}
      </section>}

      <section className={`admin-section ${activeView === "add" ? "" : "admin-view-hidden"}`}>
        <h2>Curate a salary-transparent job</h2>
        <p>
          Paste the source, record only supported facts, and write an original
          summary. Save uncertain listings as drafts until the evidence is checked.
        </p>
        <form
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
              <input name="source_url" type="url" required />
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
        </form>
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
                  onClick={() => review(item.id, "approve_job_submission")}
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

      <section className={`admin-section ${activeView === "jobs" ? "" : "admin-view-hidden"}`}>
        <h2>Published and expired jobs</h2>
        <div className="moderation-list">
          {jobs.map((job) => (
            <form
              className="moderation-card admin-job-editor"
              key={job.id}
              onSubmit={(event) => saveJob(event, job.id)}
            >
              <div className="job-form-grid">
                <label>
                  Title
                  <input name="title" defaultValue={job.title} required />
                </label>
                <label>
                  Company
                  <input
                    name="company_name"
                    defaultValue={job.company_name}
                    required
                  />
                </label>
                <label>
                  Location
                  <input name="location" defaultValue={job.location} required />
                </label>
                <label>
                  Work arrangement
                  <select name="work_mode" defaultValue={job.work_mode}>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </select>
                </label>
                <label>
                  Employment type
                  <select
                    name="employment_type"
                    defaultValue={job.employment_type}
                  >
                    <option>Full time</option>
                    <option>Part time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </label>
                <label>
                  Salary type
                  <select name="salary_type" defaultValue={job.salary_type}>
                    <option value="gross">Gross</option>
                    <option value="net">Net</option>
                    <option value="not_stated">Not stated by employer</option>
                  </select>
                </label>
                <label>
                  Currency
                  <select name="salary_currency" defaultValue={job.salary_currency}><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option></select>
                </label>
                <label>
                  Salary evidence
                  <select name="salary_source" defaultValue={job.salary_source}><option value="employer_disclosed">Employer disclosed</option><option value="source_reported">Source reported</option><option value="third_party_estimate">Third-party estimate</option></select>
                </label>
                <label>
                  Engagement
                  <select name="engagement_type" defaultValue={job.engagement_type}><option value="employee">Employee</option><option value="contractor">Independent contractor</option><option value="unknown">Not confirmed</option></select>
                </label>
                <label>
                  Verification source
                  <select name="source_kind" defaultValue={job.source_kind}><option value="employer_submission">Employer submission</option><option value="official_page">Official employer page</option><option value="licensed_feed">Licensed feed</option><option value="community_tip">Community tip checked against official page</option></select>
                </label>
                <label>
                  Source name
                  <input name="source_name" defaultValue={job.source_name || ""} />
                </label>
                <label>
                  Minimum salary
                  <input
                    name="salary_min"
                    type="number"
                    defaultValue={job.salary_min}
                    required
                  />
                </label>
                <label>
                  Maximum salary
                  <input
                    name="salary_max"
                    type="number"
                    defaultValue={job.salary_max}
                    required
                  />
                </label>
                <label>
                  Salary period
                  <select name="salary_period" defaultValue={job.salary_period}>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </label>
                <label>
                  Deadline
                  <input
                    name="expires_at"
                    type="date"
                    defaultValue={job.expires_at}
                    required
                  />
                </label>
                <label className="wide">
                  Application link
                  <input
                    name="application_url"
                    type="url"
                    defaultValue={job.application_url}
                    required
                  />
                </label>
                <label className="wide">Source link<input name="source_url" type="url" defaultValue={job.source_url || ""} /></label>
                <label className="wide">Canonical link<input name="canonical_url" type="url" defaultValue={job.canonical_url || ""} /></label>
                <label className="wide">
                  Description
                  <textarea
                    name="description"
                    defaultValue={job.description}
                    rows={8}
                    required
                  />
                </label>
                <label className="admin-check wide">
                  <input
                    name="employer_verified"
                    type="checkbox"
                    defaultChecked={job.employer_verified}
                  />
                  Employer identity verified
                </label>
                <label className="admin-check wide"><input name="global_remote" type="checkbox" defaultChecked={job.global_remote} />Available globally, not restricted to Nigeria</label>
              </div>
              <div className="moderation-actions">
                {job.status !== "published" && (
                  <button
                    type="button"
                    disabled={busy === job.id}
                    onClick={() => setJobStatus(job.id, "published")}
                  >
                    Republish
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy === job.id}
                  onClick={() => setJobStatus(job.id, "expired")}
                >
                  Expire
                </button>
                <button
                  type="button"
                  disabled={busy === job.id}
                  onClick={() => setJobStatus(job.id, "filled")}
                >
                  Mark filled
                </button>
                <button className="primary-button" disabled={busy === job.id}>
                  Save changes
                </button>
              </div>
            </form>
          ))}
        </div>
      </section>

      <section className={`admin-section ${activeView === "reports" ? "" : "admin-view-hidden"}`}>
        <h2>Open job reports</h2>
        {!reports.length && <p>No open reports.</p>}
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
