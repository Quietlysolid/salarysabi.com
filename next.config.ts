import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.SALARYSABI_STAGING === "1" ? (process.env.NODE_ENV === "development" ? ".next-staging-dev" : ".next-staging") : ".next",
  reactStrictMode: true,
  // Some browsers report transferSize=0 for fresh pages. The React debug
  // channel mistakes these for cached documents and reloads before hydration.
  experimental: { reactDebugChannel: false },
  images: { unoptimized: true },
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...(process.env.SALARYSABI_STAGING === "1" ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://challenges.cloudflare.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (process.env.SALARYSABI_STAGING !== "1") initOpenNextCloudflareForDev();
