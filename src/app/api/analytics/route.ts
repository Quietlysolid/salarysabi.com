import { NextResponse } from "next/server";
import {
  isAnalyticsEvent,
  normalizePath,
  normalizeReferrerHost,
} from "@/lib/launch";
import { getSupabaseConfig, supabaseRequest } from "@/lib/supabase";

export const runtime = "edge";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  if (!isAnalyticsEvent(body.event)) {
    return new NextResponse(null, { status: 204 });
  }

  const config = getSupabaseConfig();
  if (!config) return new NextResponse(null, { status: 204 });

  const response = await supabaseRequest(config, "rpc/record_analytics_event", {
    method: "POST",
    body: JSON.stringify({
      event_name: body.event,
      page_path: normalizePath(body.path),
      referrer_host: normalizeReferrerHost(body.referrer),
    }),
  });

  if (!response.ok) {
    console.error("Analytics storage failed", response.status);
  }
  return new NextResponse(null, { status: 204 });
}
