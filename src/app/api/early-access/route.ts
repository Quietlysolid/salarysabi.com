import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/launch";
import { getSupabaseConfig, supabaseRequest } from "@/lib/supabase";

export const runtime = "edge";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const consent = body.consent === true;
  const website = typeof body.website === "string" ? body.website.trim() : "";
  const elapsed = Number(body.elapsed);

  if (website) {
    return NextResponse.json({ ok: true });
  }
  if (!email) {
    return NextResponse.json(
      { message: "Enter a valid email address." },
      { status: 400 },
    );
  }
  if (!consent) {
    return NextResponse.json(
      { message: "Please agree to receive the early-access update." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(elapsed) || elapsed < 1200) {
    return NextResponse.json(
      { message: "Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.json(
      { message: "Early access is being connected. Please try again shortly." },
      { status: 503 },
    );
  }

  const response = await supabaseRequest(
    config,
    "early_access_signups?on_conflict=email",
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        email,
        consented_at: new Date().toISOString(),
        source: "homepage",
      }),
    },
  );

  if (!response.ok) {
    console.error("Early-access storage failed", response.status);
    return NextResponse.json(
      { message: "We could not save your email. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
