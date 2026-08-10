import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getPublishedJobsPage } from "@/lib/supabase";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

type RateLimiter = {
  limit(input: { key: string }): Promise<{ success: boolean }>;
};

function positiveInteger(value: string | null, fallback: number) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = positiveInteger(url.searchParams.get("page"), 1);
  const requestedLimit = positiveInteger(url.searchParams.get("limit"), DEFAULT_PAGE_SIZE);
  const limit = Math.min(requestedLimit, MAX_PAGE_SIZE);
  const offset = (page - 1) * limit;

  const { env } = getCloudflareContext();
  const limiter = (env as unknown as { JOBS_API_RATE_LIMITER?: RateLimiter }).JOBS_API_RATE_LIMITER;
  if (limiter) {
    const requester = request.headers.get("cf-connecting-ip") || "anonymous";
    const { success } = await limiter.limit({ key: `jobs-api:${requester}` });
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } },
      );
    }
  }

  const result = await getPublishedJobsPage(offset, limit);

  if (!result) {
    return NextResponse.json(
      { error: "Jobs are temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const totalPages = Math.max(1, Math.ceil(result.total / limit));
  return NextResponse.json({
    data: result.jobs,
    pagination: { page, limit, total: result.total, totalPages },
  }, {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
