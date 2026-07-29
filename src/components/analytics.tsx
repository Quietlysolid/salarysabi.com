"use client";

import { useEffect } from "react";
import type { AnalyticsEvent } from "@/lib/launch";

export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return;
  const payload = JSON.stringify({
    event,
    path: window.location.pathname,
    referrer: document.referrer,
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics",
      new Blob([payload], { type: "application/json" }),
    );
    return;
  }
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  });
}

export function Analytics() {
  useEffect(() => {
    track("page_view");
  }, []);
  return null;
}
