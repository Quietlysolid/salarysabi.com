"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { AnalyticsEvent } from "@/lib/launch";

const analyticsOptOutKey = "product_analytics_opt_out";

function analyticsDisabled() {
  if (process.env.NODE_ENV !== "production") return true;
  try {
    return window.localStorage.getItem(analyticsOptOutKey) === "1";
  } catch {
    return false;
  }
}

function syncAnalyticsPreference() {
  const url = new URL(window.location.href);
  const preference = url.searchParams.get("analytics");
  if (preference !== "off" && preference !== "on") return;

  try {
    if (preference === "off") window.localStorage.setItem(analyticsOptOutKey, "1");
    else window.localStorage.removeItem(analyticsOptOutKey);
  } catch {
    // Analytics remains usable when storage is unavailable.
  }

  url.searchParams.delete("analytics");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined" || analyticsDisabled() || navigator.doNotTrack === "1") return;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return;
  const pagePath = window.location.pathname;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return;

  void fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/record_analytics_event`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_event_name: event,
      p_page_path: pagePath,
      p_referrer_host: document.referrer
        ? new URL(document.referrer).hostname
        : "direct",
    }),
    keepalive: true,
  });
}

export function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    syncAnalyticsPreference();
    track("page_view");
  }, [pathname]);
  return null;
}
