"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { formatJobSalary, type Job } from "@/lib/jobs";

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

export function AdminDashboard() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reports, setReports] = useState<JobReport[]>([]);
  const [suggestions, setSuggestions] = useState<JobSuggestion[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) =>
      setSession(nextSession),
    );
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const loadDashboard = useCallback(async () => {
    const { data: isAdmin } = await supabase.rpc("is_current_user_admin");
    if (!isAdmin) {
      setMessage("This account does not have administrator access.");
      return;
    }
    const [
      submissionResult,
      suggestionResult,
      jobResult,
      reportResult,
      metricResult,
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
    ]);
    if (
      submissionResult.error ||
      suggestionResult.error ||
      jobResult.error ||
      reportResult.error ||
      metricResult.error
    ) {
      setMessage("Part of the administration dashboard could not be loaded.");
      return;
    }
    setSubmissions(submissionResult.data ?? []);
    setSuggestions(suggestionResult.data ?? []);
    setJobs(jobResult.data ?? []);
    setReports(reportResult.data ?? []);
    setMetrics(metricResult.data as Metrics);
    setMessage("");
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session) void loadDashboard();
  }, [loadDashboard, session]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.get("email")),
      password: String(data.get("password")),
    });
    setMessage(error ? error.message : "Signed in.");
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
        salary_source: "employer_disclosed",
        engagement_type: data.get("engagement_type"),
        application_url: officialUrl,
        source_url: officialUrl,
        canonical_url: officialUrl,
        source_kind: "official_page",
        source_name: company,
        source_verified_at: now,
        source_last_seen_at: now,
        employer_verified: false,
        global_remote: data.get("global_remote") === "on",
        published_at: now,
        expires_at: data.get("expires_at"),
        status: "published",
      });
    setMessage(
      error
        ? error.message
        : "Official listing published with its source and check date.",
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

  if (!session)
    return (
      <form className="admin-login" onSubmit={signIn}>
        <h1>SalarySabi administration</h1>
        <p>Sign in with an approved administrator account.</p>
        <label>
          Email
          <input type="email" name="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" required />
        </label>
        <button className="primary-button" type="submit">
          Sign in
        </button>
        <p role="status">{message}</p>
      </form>
    );

  return (
    <section className="admin-shell">
      <header>
        <div>
          <span className="eyebrow">Private workspace</span>
          <h1>Jobs administration</h1>
        </div>
        <button type="button" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>
      <p role="status">{message}</p>
      {metrics && (
        <section className="admin-metrics" aria-label="Job platform report">
          {Object.entries(metrics).map(([label, value]) => (
            <div key={label}>
              <strong>{Number(value).toLocaleString()}</strong>
              <span>{label.replaceAll("_", " ")}</span>
            </div>
          ))}
        </section>
      )}

      <section className="admin-section">
        <h2>Add an official employer listing</h2>
        <p>
          Enter only facts checked on the employer page. Write a short original
          summary; do not copy its full description.
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
              Deadline
              <input name="expires_at" type="date" required />
            </label>
            <label className="wide">
              Official application page
              <input name="source_url" type="url" required />
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
          </div>
          <button className="primary-button" disabled={busy === "official-job"}>
            Check and publish official listing
          </button>
        </form>
      </section>

      <section className="admin-section">
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
                <span className="external-arrow" aria-hidden="true" />
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

      <section className="admin-section">
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
                <span className="external-arrow" aria-hidden="true" />
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

      <section className="admin-section">
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

      <section className="admin-section">
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
