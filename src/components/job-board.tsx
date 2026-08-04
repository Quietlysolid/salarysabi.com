"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { track } from "./analytics";
import {
  estimatedMonthlyAfterPaye,
  formatJobSalary,
  jobMatches,
  monthlyGrossRange,
  salarySourceLabel,
  verificationLabel,
  type Job,
  type WorkMode,
} from "@/lib/jobs";

const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function JobBoard() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState("");
  const [workMode, setWorkMode] = useState<"all" | WorkMode>("all");
  const [location, setLocation] = useState("all");
  const [employmentType, setEmploymentType] = useState("all");
  const [minimumSalary, setMinimumSalary] = useState(0);
  const [currency, setCurrency] = useState<
    "all" | "NGN" | "USD" | "GBP" | "EUR"
  >("all");
  const [sort, setSort] = useState<"newest" | "salary">("newest");
  const [state, setState] = useState<"loading" | "ready" | "error">(
    configured ? "loading" : "error",
  );

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return;
    fetch(
      `${url.replace(/\/$/, "")}/rest/v1/jobs?select=*&order=published_at.desc`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      },
    )
      .then((response) => {
        if (!response.ok) throw new Error("Jobs unavailable");
        return response.json() as Promise<Job[]>;
      })
      .then((rows) => {
        setJobs(rows);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  const locations = useMemo(
    () => [...new Set(jobs.map((job) => job.location))].sort(),
    [jobs],
  );
  const visible = useMemo(() => {
    const rows = jobs.filter(
      (job) =>
        jobMatches(job, query, workMode) &&
        (location === "all" || job.location === location) &&
        (employmentType === "all" || job.employment_type === employmentType) &&
        (currency === "all" || job.salary_currency === currency) &&
        (minimumSalary === 0 ||
          (job.salary_currency === "NGN" && job.salary_max >= minimumSalary)),
    );
    return rows.sort((a, b) =>
      sort === "salary"
        ? b.salary_max - a.salary_max
        : new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime(),
    );
  }, [
    currency,
    employmentType,
    jobs,
    location,
    minimumSalary,
    query,
    sort,
    workMode,
  ]);

  return (
    <>
      <div className="job-search" role="search">
        <label>
          <span>Search jobs</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Job title, skill, company or location"
          />
        </label>
        <label>
          <span>Where you’ll work</span>
          <select
            value={workMode}
            onChange={(event) =>
              setWorkMode(event.target.value as "all" | WorkMode)
            }
          >
            <option value="all">All</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
        </label>
        <label>
          <span>Location</span>
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            <option value="all">All locations</option>
            {locations.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <details className="job-more-filters">
          <summary>More filters</summary>
          <div>
        <label>
          <span>Job type</span>
          <select
            value={employmentType}
            onChange={(event) => setEmploymentType(event.target.value)}
          >
            <option value="all">All types</option>
            <option>Full time</option>
            <option>Part time</option>
            <option>Contract</option>
            <option>Internship</option>
          </select>
        </label>
        <label>
          <span>Paid in</span>
          <select
            value={currency}
            onChange={(event) => {
              setCurrency(event.target.value as typeof currency);
              setMinimumSalary(0);
            }}
          >
            <option value="all">All currencies</option>
            <option value="NGN">Nigerian naira</option>
            <option value="USD">US dollar</option>
            <option value="GBP">British pound</option>
            <option value="EUR">Euro</option>
          </select>
        </label>
        <label>
          <span>Minimum salary</span>
          <select
            value={minimumSalary}
            onChange={(event) => setMinimumSalary(Number(event.target.value))}
          >
            <option value="0">Any salary</option>
            <option value="100000">₦100,000+</option>
            <option value="250000">₦250,000+</option>
            <option value="500000">₦500,000+</option>
            <option value="1000000">₦1,000,000+</option>
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as "newest" | "salary")
            }
          >
            <option value="newest">Newest first</option>
            <option value="salary">Highest salary</option>
          </select>
        </label>
          </div>
        </details>
      </div>

      {state === "loading" && (
        <div className="jobs-state">Loading jobs…</div>
      )}
      {state === "error" && (
        <div className="jobs-state error">
          Jobs could not be loaded right now. Please try again later.
        </div>
      )}
      {state === "ready" && visible.length === 0 && (
        <div className="jobs-state">
          <strong>No matching jobs yet.</strong>
          <span>Try another search or check again soon.</span>
        </div>
      )}
      {state === "ready" && visible.length > 0 && (
        <p className="job-result-count">
          {visible.length} matching {visible.length === 1 ? "job" : "jobs"}
        </p>
      )}

      <div className="job-list">
        {visible.map((job) => {
          const gross = monthlyGrossRange(job);
          return (
            <article className="job-card" key={job.id}>
              <div className="job-card-top">
                <div>
                  <span className="job-company">{job.company_name}</span>
                  <h2>
                    {job.source_kind === "licensed_feed" && job.source_url ? (
                      <a href={job.source_url} target="_blank" rel="noopener">{job.title}<span className="sr-only"> (opens at {job.source_name || "the licensed source"} in a new tab)</span></a>
                    ) : <Link href={`/jobs/${job.slug}`}>{job.title}</Link>}
                  </h2>
                </div>
                <span
                  className={
                    job.employer_verified
                      ? "verification verified"
                      : "verification"
                  }
                >
                  {verificationLabel(job)}
                </span>
              </div>
              <div className="job-meta">
                <span>{job.location}</span>
                <span>
                  {job.work_mode === "onsite" ? "On-site" : job.work_mode}
                </span>
                <span>{job.employment_type}</span>
              </div>
              <strong className="job-salary">{formatJobSalary(job)}</strong>
              <small>{salarySourceLabel(job)}</small>
              {gross && (
                <div className="take-home-preview">
                  <span>Estimated pay after PAYE</span>
                  <strong>
                    {money.format(estimatedMonthlyAfterPaye(gross.minimum))}–
                    {money.format(estimatedMonthlyAfterPaye(gross.maximum))} /
                    month
                  </strong>
                  <small>
                    Excludes pension, NHF, NHIS and other deductions. Your
                    actual result depends on eligible deductions.
                  </small>
                </div>
              )}
              <p className="job-card-summary">
                {job.description.slice(0, 220)}
                {job.description.length > 220 ? "..." : ""}
              </p>
              <div className="job-card-footer">
                <span>
                  Source checked{" "}
                  {new Date(job.source_verified_at).toLocaleDateString(
                    "en-NG",
                    { day: "numeric", month: "short", year: "numeric" },
                  )}
                </span>
                <span>
                  Closes{" "}
                  {new Date(job.expires_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <Link href={`/jobs/${job.slug}`}>View job</Link>
                <a
                  href={job.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("job_apply_clicked")}
                >
                  Apply on company site
                  <span className="external-arrow" aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
