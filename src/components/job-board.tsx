"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { track } from "./analytics";
import { ExternalLinkIcon } from "./external-link-icon";
import { formatJobDate, jobDeadlineLabel, jobMatches, salarySourceLabel, verificationLabel, type Job, type WorkMode } from "@/lib/jobs";
import { ProductState } from "./product-state";

const jobsCacheKey = "salarysabi:jobs-cache:v1";

function salaryAmount(job: Job, monthly = false) {
  const divisor = monthly && job.salary_period === "annual" ? 12 : 1;
  const formatter = new Intl.NumberFormat(job.salary_currency === "NGN" ? "en-NG" : "en-US", { style: "currency", currency: job.salary_currency, maximumFractionDigits: 0 });
  const minimum = formatter.format(job.salary_min / divisor);
  const maximum = formatter.format(job.salary_max / divisor);
  return job.salary_min === job.salary_max ? minimum : `${minimum} to ${maximum}`;
}

function closesToday(value: string) {
  return value.slice(0, 10) === "2026-08-05";
}

export function JobBoard({ initialJobs }: { initialJobs: Job[] | null }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs ?? []);
  const [query, setQuery] = useState("");
  const [workMode, setWorkMode] = useState<"all" | WorkMode>("all");
  const [location, setLocation] = useState("all");
  const [currency, setCurrency] = useState<"all" | "NGN" | "USD" | "GBP" | "EUR">("all");
  const [sort, setSort] = useState<"closing" | "newest" | "salary">("closing");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "cached" | "error">(initialJobs ? "ready" : "loading");

  useEffect(() => {
    if (reloadKey === 0 && initialJobs) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    fetch("/api/jobs", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Jobs unavailable");
        return response.json() as Promise<Job[]>;
      })
      .then((rows) => {
        window.clearTimeout(timeout);
        setJobs(rows);
        setState("ready");
        try { localStorage.setItem(jobsCacheKey, JSON.stringify({ savedAt: new Date().toISOString(), rows })); } catch {}
      })
      .catch(() => {
        window.clearTimeout(timeout);
        try {
          const cached = JSON.parse(localStorage.getItem(jobsCacheKey) || "null") as { savedAt: string; rows: Job[] } | null;
          if (cached?.rows?.length) { setJobs(cached.rows); setState("cached"); return; }
        } catch {}
        setState("error");
      });
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [initialJobs, reloadKey]);

  const locations = useMemo(() => [...new Set(jobs.map((job) => job.location))].sort(), [jobs]);
  const showDiscoveryControls = jobs.length > 1;
  const visible = useMemo(() => {
    const rows = jobs.filter((job) =>
      jobMatches(job, query, workMode) &&
      (location === "all" || job.location === location) &&
      (currency === "all" || job.salary_currency === currency),
    );
    return rows.sort((a, b) => {
      if (sort === "salary") return b.salary_max - a.salary_max;
      if (sort === "closing") {
        const aUnknown = a.deadline_status === "unknown" || a.deadline_status === "rolling";
        const bUnknown = b.deadline_status === "unknown" || b.deadline_status === "rolling";
        if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
        return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
      }
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
  }, [currency, jobs, location, query, sort, workMode]);

  function clearFilters() {
    setQuery("");
    setWorkMode("all");
    setLocation("all");
    setCurrency("all");
    setSort("closing");
  }

  return (
    <div className={showDiscoveryControls?"jobs-results-layout":"jobs-results-layout jobs-results-layout--simple"}>
      {showDiscoveryControls&&<button
        type="button"
        className="job-filter-toggle"
        aria-expanded={filtersOpen}
        aria-controls="job-search-filters"
        onClick={() => setFiltersOpen((open) => !open)}
      >
        {filtersOpen ? "Hide filters" : "Filter jobs"}
        <span aria-hidden="true">{filtersOpen ? "−" : "+"}</span>
      </button>}
      {showDiscoveryControls&&<aside id="job-search-filters" className={filtersOpen ? "job-search is-open" : "job-search"} role="search" aria-label="Refine job results">
        <h2>Refine results</h2>
        <label><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Job title, skill, company or location" /></label>
        <label><span>Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option value="all">All locations</option>{locations.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Work arrangement</span><select value={workMode} onChange={(event) => setWorkMode(event.target.value as "all" | WorkMode)}><option value="all">All arrangements</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></label>
        <label><span>Salary currency</span><select value={currency} onChange={(event) => setCurrency(event.target.value as typeof currency)}><option value="all">All currencies</option><option value="NGN">NGN</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select></label>
        <button type="button" onClick={clearFilters}>Clear all</button>
      </aside>}

      <div className="job-results-column">
        {(showDiscoveryControls||state==="loading")&&<div className="job-results-toolbar">
          <p>{state === "loading" ? <strong>Loading jobs</strong> : <><strong>{visible.length}</strong> {visible.length === 1 ? "job" : "jobs"} available</>}</p>
          {showDiscoveryControls&&<label><span>Sort by</span><select disabled={state === "loading" || state === "error"} value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="closing">Closing date, earliest first</option><option value="newest">Newest first</option><option value="salary">Highest salary</option></select></label>}
        </div>}

        {state === "loading" && <ProductState kind="loading" title="Loading current jobs" detail="Your filters will remain available." />}
        {state === "error" && <ProductState kind="error" title="We could not load the jobs" detail="Your filters are still here. Retry now or check back shortly." action={<button type="button" onClick={() => { setState("loading"); setReloadKey((value) => value + 1); }}>Try again</button>} links={<><Link href="/account">Open job workspace</Link><Link href="/suggest-a-job">Share an existing job</Link></>} />}
        {state === "cached" && <ProductState compact kind="cached" title="Showing recently saved listings" detail="We are reconnecting. Application links may have changed." action={<button type="button" onClick={() => setReloadKey((value) => value + 1)}>Refresh</button>} />}
        {(state === "ready" || state === "cached") && visible.length === 0 && (jobs.length === 0
          ? <ProductState
              kind="empty"
              title="New salary-transparent jobs are coming."
              detail="SalarySabi verifies the pay and original source before publishing each role."
              action={<Link href="/suggest-a-job">Share a job lead</Link>}
              links={<Link href="/post-a-job">Hiring? Post a role</Link>}
            />
          : <ProductState kind="empty" title="No jobs match your filters." detail="Try a broader role or location." action={<button type="button" onClick={clearFilters}>Clear filters</button>} />)}

        <div className="job-list">
          {visible.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="job-list-role">
                <h2><Link href={`/jobs/${job.slug}`}>{job.title}</Link></h2>
                <p>{job.company_name}</p>
                <small>{job.location}</small>
              </div>
              <div className="job-list-salary">
                <span>Salary</span>
                <strong>{salaryAmount(job)}</strong>
                <small>{job.salary_period === "annual" ? "per year" : "per month"}</small>
                {job.salary_period === "annual" && <small>{salaryAmount(job, true)} per month</small>}
              </div>
              <div className="job-list-facts">
                <span>{job.work_mode === "onsite" ? "On-site" : job.work_mode[0].toUpperCase()+job.work_mode.slice(1)}</span>
                <span>{job.employment_type}</span>
              </div>
              <div className={closesToday(job.expires_at) && job.deadline_status !== "unknown" ? "job-list-closing urgent" : "job-list-closing"}>
                <strong>{salarySourceLabel(job)}</strong>
                <span>{closesToday(job.expires_at) && job.deadline_status !== "unknown" ? "Closes today" : jobDeadlineLabel(job)}</span>
                <small>{verificationLabel(job)} · Checked {formatJobDate(job.source_verified_at)}</small>
              </div>
              <div className={`job-list-actions ${job.employer_verified ? "is-verified" : "needs-review"}`}><Link href={`/jobs/${job.slug}`}>{job.employer_verified ? "View details" : "Review details first"}</Link><a href={job.application_url} target="_blank" rel="noopener noreferrer" onClick={() => track("job_apply_clicked")}>Apply on {job.source_name||"listing site"} <ExternalLinkIcon /><span className="sr-only"> (opens in a new tab)</span></a></div>
            </article>
          ))}
        </div>
        {(state === "ready" || state === "cached") && visible.length > 1 && <p className="jobs-end-state">End of results.</p>}
      </div>
    </div>
  );
}
