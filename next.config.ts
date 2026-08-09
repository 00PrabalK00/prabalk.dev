import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * The site now hosts a private control panel and an API that a physical device
 * in another country authenticates against, so the headers are no longer
 * cosmetic. The rules below are the ones that actually change outcomes:
 * `frame-ancestors` and `X-Frame-Options` kill clickjacking of /os, `base-uri`
 * and `form-action` stop an injected tag from redirecting a login POST, and
 * `Referrer-Policy` keeps the /os URL out of other sites' logs.
 *
 * On script-src: this is `'unsafe-inline'` and, in development, `'unsafe-eval'`.
 * That is a deliberate, documented trade rather than an oversight. Next inlines
 * hydration and the theme-flash-prevention script, and the honest alternative —
 * per-request nonces — requires the proxy to rewrite every HTML response, which
 * defeats static optimisation across the whole 3D portfolio for a threat model
 * where there is no user-generated content to inject in the first place. What
 * the policy does buy is real: no third-party origin can load a script, an
 * iframe, or an object here, and nothing can exfiltrate to an arbitrary host.
 *
 * If /os ever renders untrusted input, revisit this first.
 */

const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Tailwind and the inline critical styles Next emits.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  // next/font self-hosts at build time, so no external font origin is needed.
  "font-src 'self' data:",
  // Vercel Speed Insights posts to vitals.vercel-insights.com; Analytics is
  // same-origin via /_vercel/insights.
  "connect-src 'self' https://vitals.vercel-insights.com",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Two years, subdomains included. No `preload` directive: getting onto the
  // preload list is easy and getting off it takes months, and api.* or a
  // future subdomain might legitimately need plain HTTP during setup.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // The private half is never cached anywhere, by anyone.
        source: "/(os|login)/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
