import { createClient } from "npm:@supabase/supabase-js@2";
import { canonicalizeContributionUrl, htmlToPlainText, isPrivateHostname, normalizedContributionPayload, pageTitle, salaryEvidenceExcerpt } from "../_shared/contribution-security.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const allowedSite = Deno.env.get("PUBLIC_SITE_URL") || "https://salarysabi.com";

function cors(request: Request) {
  const origin = request.headers.get("origin") || "";
  const allowed = origin === allowedSite || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : allowedSite,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-salarysabi-device",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return Response.json(body, { status, headers: cors(request) });
}

async function hmac(value: string) {
  const secret = Deno.env.get("RISK_FINGERPRINT_SECRET");
  if (!secret) throw new Error("Security fingerprinting is not configured");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(token: string, remoteip: string, action: string) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) throw new Error("Human verification is not configured");
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip }),
  });
  const result = await response.json() as { success?: boolean; action?: string; hostname?: string };
  return Boolean(result.success && (!result.action || result.action === action));
}

async function assertPublicHost(hostname: string) {
  if (isPrivateHostname(hostname)) throw new Error("Private network URLs are not allowed");
  if (!/^[a-z0-9.-]+$/i.test(hostname)) throw new Error("Invalid source hostname");
  for (const type of ["A", "AAAA"] as const) {
    try {
      const addresses = await Deno.resolveDns(hostname, type);
      if (addresses.some(isPrivateHostname)) throw new Error("Private network URLs are not allowed");
    } catch (error) {
      if (error instanceof Error && error.message.includes("Private network")) throw error;
    }
  }
}

async function readLimited(response: Response, limit = 1_000_000) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > limit) throw new Error("Source page is too large to verify");
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) { await reader.cancel(); throw new Error("Source page is too large to verify"); }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(merged);
}

async function fetchEvidence(rawUrl: string, advertisedSalary: string) {
  let current = canonicalizeContributionUrl(rawUrl);
  if (!current) throw new Error("Use the employer's secure HTTPS vacancy URL");
  for (let redirect = 0; redirect < 4; redirect++) {
    const url = new URL(current);
    await assertPublicHost(url.hostname);
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(12_000), headers: { "User-Agent": "SalarySabi-Evidence-Check/1.0" } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("The source redirected without a destination");
      current = canonicalizeContributionUrl(new URL(location, current).toString());
      if (!current) throw new Error("The source redirected to an unsafe URL");
      continue;
    }
    if (!response.ok) throw new Error(`The vacancy page returned ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) throw new Error("The source is not a public vacancy page");
    const html = await readLimited(response);
    const text = htmlToPlainText(html);
    const salary = salaryEvidenceExcerpt(text, advertisedSalary);
    if (!salary.verified) throw new Error("The salary entered could not be found on the vacancy page");
    return {
      canonicalUrl: current,
      sourceDomain: new URL(current).hostname,
      title: pageTitle(html),
      excerpt: salary.excerpt,
      contentFingerprint: await hmac(text),
      fetchStatus: "verified",
    };
  }
  throw new Error("The source redirected too many times");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors(request) });
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);
  const origin = request.headers.get("origin") || "";
  if (origin && origin !== allowedSite && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return json(request, { error: "Origin not allowed" }, 403);

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return json(request, { error: "Use the secure email sign-in before submitting a reward claim." }, 401);

  try {
    const body = await request.json() as Record<string, unknown>;
    const type = body.type === "job_source" ? "job_source" : body.type === "salary_report" ? "salary_report" : "";
    if (!type || typeof body.campaignId !== "string" || typeof body.turnstileToken !== "string") return json(request, { error: "The submission is incomplete." }, 400);
    const remoteIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const device = request.headers.get("x-salarysabi-device") || "missing";
    const action = type === "salary_report" ? "reward_salary" : "reward_job";
    if (!await verifyTurnstile(body.turnstileToken, remoteIp, action)) return json(request, { error: "Complete the human verification and try again." }, 403);

    const [networkFingerprint, deviceFingerprint, contributorFingerprint, submissionFingerprint] = await Promise.all([
      hmac(`network:${remoteIp}`), hmac(`device:${device}`), hmac(`contributor:${userData.user.id}`),
      hmac(`${type}:${normalizedContributionPayload(body.payload)}`),
    ]);
    for (const [rateAction, bucket] of [["reward_submit_network", networkFingerprint], ["reward_submit_device", deviceFingerprint], ["reward_submit_contributor", contributorFingerprint]] as const) {
      const { data: allowed, error } = await supabase.rpc("service_consume_contribution_rate_limit", { p_action: rateAction, p_bucket_hash: bucket });
      if (error) throw error;
      if (!allowed) return json(request, { error: "Too many reward submissions were attempted. Wait before trying again." }, 429);
    }

    const payload = (body.payload && typeof body.payload === "object" ? body.payload : {}) as Record<string, unknown>;
    if (type === "salary_report") {
      const { data, error } = await supabase.rpc("service_submit_rewarded_salary_report", {
        p_contributor_id: userData.user.id, p_campaign_id: body.campaignId,
        p_role: payload.role, p_industry: payload.industry, p_location: payload.location,
        p_experience_band: payload.experienceBand, p_company_size: payload.companySize,
        p_monthly_gross: payload.monthlyGross, p_pay_reliability: payload.payReliability,
        p_submission_fingerprint: submissionFingerprint, p_network_fingerprint: networkFingerprint, p_device_fingerprint: deviceFingerprint,
      });
      if (error) throw error;
      return json(request, data, 201);
    }

    const officialUrl = String(payload.officialUrl || "");
    const advertisedSalary = String(payload.advertisedSalary || "");
    const evidence = await fetchEvidence(officialUrl, advertisedSalary);
    const { data, error } = await supabase.rpc("service_submit_rewarded_job_source", {
      p_contributor_id: userData.user.id, p_campaign_id: body.campaignId,
      p_official_url: officialUrl, p_company_name: payload.companyName, p_advertised_salary: advertisedSalary, p_notes: payload.notes,
      p_submission_fingerprint: submissionFingerprint, p_network_fingerprint: networkFingerprint, p_device_fingerprint: deviceFingerprint,
      p_canonical_url: evidence.canonicalUrl, p_source_domain: evidence.sourceDomain, p_page_title: evidence.title,
      p_salary_excerpt: evidence.excerpt, p_content_fingerprint: evidence.contentFingerprint, p_fetch_status: evidence.fetchStatus,
    });
    if (error) throw error;
    return json(request, data, 201);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : "The rewarded contribution could not be verified.";
    const configuration = message.includes("not configured");
    return json(request, { error: configuration ? "Reward security is temporarily unavailable." : message }, configuration ? 503 : 422);
  }
});
