"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (target: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

export function contributorDeviceId() {
  const key = "salarysabi-contributor-device";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.localStorage.setItem(key, value);
  return value;
}

export function TurnstileCheck({ action, onToken, resetSignal = 0 }: { action: "reward_salary" | "reward_job"; onToken: (token: string) => void; resetSignal?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string>("");
  const [loaded, setLoaded] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const localPreview = !siteKey && process.env.NODE_ENV !== "production";

  const renderWidget = useCallback(() => {
    const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
    if (!api || !containerRef.current || !siteKey || widgetRef.current) return;
    widgetRef.current = api.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme: "light",
      size: "flexible",
      callback: (token: string) => onToken(token),
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
  }, [action, onToken, siteKey]);

  useEffect(() => {
    if (localPreview) onToken("local-preview-only");
  }, [localPreview, onToken]);

  useEffect(() => {
    if (loaded) renderWidget();
  }, [loaded, renderWidget]);

  useEffect(() => {
    const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
    if (api && widgetRef.current) {
      api.reset(widgetRef.current);
      onToken("");
    }
  }, [onToken, resetSignal]);

  useEffect(() => () => {
    const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
    if (api && widgetRef.current) api.remove(widgetRef.current);
  }, []);

  if (localPreview) return <div className="human-check is-local"><strong>Human check</strong><span>Local preview only. Configure Turnstile before testing a real reward submission.</span></div>;
  if (!siteKey) return <div className="human-check is-unavailable" role="alert"><strong>Reward submissions are temporarily unavailable.</strong><span>The security check is not configured.</span></div>;

  return <div className="human-check">
    <Script onLoad={() => setLoaded(true)} src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
    <span>Quick security check</span>
    <div ref={containerRef} />
  </div>;
}
