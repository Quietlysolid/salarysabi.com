import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isAnalyticsEvent, isPublicAnalyticsPath, normalizePath, normalizeReferrerHost } from "@/lib/launch";

type RateLimiter = {
  limit(input: { key: string }): Promise<{ success: boolean }>;
};

const allowedBodyKeys = new Set(["event", "pagePath", "referrerHost"]);
const botPattern = /(?:bot|crawler|spider|headless|lighthouse|pagespeed|googlebot|adsbot|mediapartners-google)/i;

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 1024) return new Response(null, { status: 413 });

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (!origin || origin !== requestUrl.origin) return new Response(null, { status: 403 });

  const userAgent = request.headers.get("user-agent") || "";
  if (botPattern.test(userAgent)) return noContent();

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return new Response(null, { status: 400 });
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    return new Response(null, { status: 400 });
  }

  if (Object.keys(payload).some((key) => !allowedBodyKeys.has(key))) {
    return new Response(null, { status: 400 });
  }
  if (!isAnalyticsEvent(payload.event)) return new Response(null, { status: 400 });

  const pagePath = normalizePath(payload.pagePath);
  if (!isPublicAnalyticsPath(pagePath)) return noContent();
  const referrerHost = normalizeReferrerHost(payload.referrerHost);

  const { env } = getCloudflareContext();
  const limiter = (env as unknown as { ANALYTICS_API_RATE_LIMITER?: RateLimiter }).ANALYTICS_API_RATE_LIMITER;
  if (limiter) {
    const requester = request.headers.get("cf-connecting-ip") || "anonymous";
    const { success } = await limiter.limit({ key: `analytics:${requester}` });
    if (!success) return new Response(null, { status: 429, headers: { "Retry-After": "60" } });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return noContent();

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/record_analytics_event`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_event_name: payload.event,
        p_page_path: pagePath,
        p_referrer_host: referrerHost,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return new Response(null, { status: 503 });
  } catch {
    return new Response(null, { status: 503 });
  }

  return noContent();
}
