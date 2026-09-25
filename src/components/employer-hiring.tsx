"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HiringAccount } from "./hiring-account";
import { ProductState } from "./product-state";
import { createBrowserSupabaseClient } from "@/lib/supabase";
type HiringRecord = { id: string; title: string; company_name: string; review_status: string; created_at: string; expires_at: string; job_slug: string | null; job_status: string | null };
export function EmployerHiring({ initialRecovery = false }: { initialRecovery?: boolean }) {
  const [recovery, setRecovery] = useState(initialRecovery);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [signedIn, setSignedIn] = useState(false);
  const [records, setRecords] = useState<HiringRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let generation = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Includes INITIAL_SESSION. Clear private rows immediately on account changes
    // and discard responses belonging to an earlier session or unmounted page.
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      const request = ++generation;
      clearTimeout(timer);
      setSignedIn(Boolean(session)); setRecords([]); setMessage("");
      setLoading(Boolean(session));
      if (!session) return;
      // Run outside the auth callback so the client's session lock is released.
      timer = setTimeout(async () => {
        try {
          const { data, error } = await supabase.rpc("employer_hiring_records").abortSignal(AbortSignal.timeout(15000));
          if (request !== generation) return;
          if (error) setMessage("We could not load your listings. Please try again.");
          else setRecords((data ?? []) as HiringRecord[]);
        } catch {
          if (request === generation) setMessage("We could not load your listings. Please try again.");
        } finally {
          if (request === generation) setLoading(false);
        }
      }, 0);
    });
    return () => { generation++; clearTimeout(timer); subscription.subscription.unsubscribe(); };
  }, [supabase, retry]);
  return <section className="hiring-workspace" aria-labelledby="hiring-title">
    <header className="hiring-heading"><div><h1 id="hiring-title">Manage my listings</h1><p>Track your job submissions and publication status.</p></div><Link className="primary-button" href="/post-a-job">Post a job</Link></header>
    {loading ? <ProductState kind="loading" title="Loading your listings" compact /> : !signedIn || recovery ? <HiringAccount recovery={recovery} hasSession={signedIn} onRecovered={() => { setRecovery(false); window.history.replaceState({}, "", "/hiring"); setRetry(value => value + 1); }} /> : message ? <ProductState kind="error" title="Listings could not be loaded" detail="Try again to reconnect." action={<button className="primary-button" type="button" onClick={() => setRetry(value => value + 1)}>Try again</button>} /> : !records.length ? <ProductState kind="empty" title="No listings yet" detail="Jobs posted from this account will appear here. Guest submissions are not linked automatically." /> : <div className="hiring-list" aria-label="Your job listings">
      {records.map(record => {
        const live = record.review_status === "approved" && record.job_status === "published" && record.expires_at >= new Date().toISOString().slice(0,10);
        const status = live ? "Live" : record.review_status === "approved" ? "No longer live" : record.review_status === "pending" ? "In review" : "Not approved";
        return <article className="hiring-record" key={record.id}><div><h2>{record.title}</h2><p>{record.company_name}</p><small>Submitted {new Intl.DateTimeFormat("en-NG", {day:"numeric",month:"short",year:"numeric"}).format(new Date(record.created_at))}</small></div><span className={`hiring-status${live ? " is-live" : ""}`}>{status}</span><nav className="hiring-actions" aria-label={`Actions for ${record.title}`}>
          {record.job_slug && live && <Link href={`/jobs/${record.job_slug}`}>View listing</Link>}
          {record.review_status === "approved" && <details><summary>Hired someone?</summary><p>Confirm their agreed pay and details before creating a separate payroll record.</p><Link href="/payroll?view=team">Add to payroll</Link></details>}
        </nav></article>;
      })}
    </div>}
  </section>;
}
