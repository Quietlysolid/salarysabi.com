"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { ProductState } from "./product-state";

export type SavedJobRow = { job_id: string; jobs: { slug: string; title: string; company_name: string; expires_at: string } | null };
export type ApplicationJobRow = { job_id: string; status: string; jobs: { slug: string; title: string; company_name: string } | null };
export type JobAlertRow = { id: string; keywords: string; location: string; work_mode: string; active: boolean };

export function JobWorkspace({ email, saved, applications, alerts, message, onSignOut, onRemoveSaved, onUpdateApplication, onRemoveAlert, onCreateAlert, busy }: {
  onCreateAlert?: (event: FormEvent<HTMLFormElement>) => void;
  busy?: boolean;
  email: string;
  saved: SavedJobRow[];
  applications: ApplicationJobRow[];
  alerts: JobAlertRow[];
  message?: string;
  onSignOut: () => void;
  onRemoveSaved: (jobId: string) => void;
  onUpdateApplication: (jobId: string, status: string) => void;
  onRemoveAlert: (id: string) => void;
}) {
  return <section className="account-shell"><header><div><span className="eyebrow">Job workspace</span><h1>{email}</h1></div><button onClick={onSignOut}>Sign out</button></header><p role="status">{message}</p>
    <section><h2>Saved jobs</h2>{!saved.length && <ProductState compact kind="empty" title="No saved jobs yet" links={<Link href="/jobs">Browse jobs</Link>} />}{saved.map((item) => !item.jobs ? <article className="account-row" key={item.job_id}><span>This listing is no longer available.</span><button onClick={() => onRemoveSaved(item.job_id)}>Remove</button></article> : <article className="account-row" key={item.job_id}><div><Link href={`/jobs/${item.jobs.slug}`}>{item.jobs.title}</Link><span>{item.jobs.company_name}</span></div><button onClick={() => onRemoveSaved(item.job_id)}>Remove</button></article>)}</section>
    <section><h2>Applications</h2>{!applications.length && <ProductState compact kind="empty" title="No tracked applications yet" links={<Link href="/jobs">Find a job</Link>} />}{applications.map((item) => !item.jobs ? <article className="account-row" key={item.job_id}><span>This listing is no longer available.</span><span>Application status: {item.status}</span></article> : <article className="account-row" key={item.job_id}><div><Link href={`/jobs/${item.jobs.slug}`}>{item.jobs.title}</Link><span>{item.jobs.company_name}</span></div><select aria-label={`Application status for ${item.jobs.title}`} value={item.status} onChange={(event) => onUpdateApplication(item.job_id, event.target.value)}><option value="applied">Applied</option><option value="interviewing">Interviewing</option><option value="offered">Offer received</option><option value="rejected">Not selected</option><option value="withdrawn">Withdrawn</option></select>{item.status === "offered" && <Link href={`/calculator?job=${encodeURIComponent(item.jobs.slug)}`}>Estimate this offer&apos;s take-home</Link>}</article>)}</section>
    {onCreateAlert && <details id="create-job-alert"><summary>Create a job alert</summary><form onSubmit={onCreateAlert}><label>Keywords<input name="keywords" minLength={2} maxLength={120} required /></label><label>Location, optional<input name="location" maxLength={120} /></label><label>Work arrangement<select name="work_mode"><option value="all">Any arrangement</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></label><label><input type="checkbox" required />Email me matching jobs. I can unsubscribe at any time.</label><button type="submit" disabled={busy}>Save alert</button></form></details>}
    <section><h2>Job alerts</h2>{!alerts.length && <ProductState compact kind="empty" title="No job alerts yet" links={<a href="#create-job-alert">Create an alert</a>} />}{alerts.map((item) => <article className="account-row" key={item.id}><div><strong>{item.keywords}</strong><span>{item.location || "Any location"} · {item.work_mode} · {item.active ? "Active" : "Unsubscribed"}</span></div><button onClick={() => onRemoveAlert(item.id)}>Delete</button></article>)}</section>
  </section>;
}
