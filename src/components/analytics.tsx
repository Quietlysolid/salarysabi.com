"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { AnalyticsEvent } from "@/lib/launch";

let posthogReady = false;

async function capturePostHog(event: AnalyticsEvent, path: string) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!key) return;
  const posthog = (await import("posthog-js")).default;
  if (!posthogReady) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      person_profiles: "identified_only",
      persistence: "memory",
      mask_all_text: true,
      mask_all_element_attributes: true,
    });
    posthogReady = true;
  }
  posthog.capture(event === "page_view" ? "$pageview" : event, { $current_url: path });
}

export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return;
  const pagePath = window.location.pathname;
  void capturePostHog(event, pagePath);
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
    track("page_view");
  }, [pathname]);
  return null;
}
