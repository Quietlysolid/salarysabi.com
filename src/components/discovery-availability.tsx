"use client";

import { useEffect, useState } from "react";

/** Availability comes from public data; failed requests never imply an empty service. */
export function DiscoveryAvailability({ kind }: { kind: "jobs" | "salaries" }) {
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    async function load() {
      try {
        if (kind === "jobs") {
          const response = await fetch("/api/jobs?page=1&limit=1", { signal: controller.signal });
          if (!response.ok) return;
          const result = await response.json() as { data?: unknown } | null;
          if (Array.isArray(result?.data) && !controller.signal.aborted) setNotice(result.data.length ? "" : "No published jobs right now.");
        } else {
          const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
          if (!endpoint || !key) return;
          const response = await fetch(`${endpoint}/rest/v1/rpc/public_recent_salary_benchmarks`, {
            method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: "{}", signal: controller.signal,
          });
          if (!response.ok) return;
          const rows = await response.json();
          if (Array.isArray(rows) && !controller.signal.aborted) setNotice(rows.some(row => Number(row.sample_size) >= 5) ? "" : "No salary comparisons published yet.");
        }
      } catch { /* The destination provides retry and error handling. */ }
      finally { clearTimeout(timer); }
    }
    void load();
    return () => { clearTimeout(timer); controller.abort(); };
  }, [kind]);
  return notice ? <small className="discovery-availability">{notice}</small> : null;
}
