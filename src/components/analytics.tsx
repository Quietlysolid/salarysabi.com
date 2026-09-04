"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { AnalyticsEvent } from "@/lib/launch";
import { isPublicAnalyticsPath } from "@/lib/launch";

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
  if (!isPublicAnalyticsPath(pagePath)) return;

  void fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event,
      pagePath,
      referrerHost: document.referrer
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
    if (isPublicAnalyticsPath(pathname)) track("page_view");
  }, [pathname]);
  return null;
}
