import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CANONICAL_HOST = "salarysabi.com";

export function middleware(request: NextRequest) {
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();
  const protocol = forwardedProtocol ?? request.nextUrl.protocol.replace(":", "");
  const hostname = request.nextUrl.hostname.toLowerCase();

  if (
    (hostname === CANONICAL_HOST || hostname === `www.${CANONICAL_HOST}`) &&
    (hostname !== CANONICAL_HOST || protocol !== "https")
  ) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.protocol = "https";
    canonicalUrl.hostname = CANONICAL_HOST;
    canonicalUrl.port = "";

    return NextResponse.redirect(canonicalUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
