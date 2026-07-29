"use client";

import { useEffect } from "react";
import type { AnalyticsEvent } from "@/lib/launch";

export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return;
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
      p_page_path: window.location.pathname,
      p_referrer_host: document.referrer
        ? new URL(document.referrer).hostname
        : "direct",
    }),
    keepalive: true,
  });
}

export function Analytics() {
  useEffect(() => {
    track("page_view");
  }, []);
  return null;
}
