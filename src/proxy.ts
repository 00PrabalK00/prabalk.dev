import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/prabalos/session";

/**
 * Edge guard for the private half of the site.
 *
 * Next 16 renamed the `middleware` convention to `proxy`; the behaviour is
 * unchanged. This runs before any route renders, so anonymous traffic to /os
 * never reaches a server component that would otherwise have to open a Redis
 * connection to find out it should have been a redirect.
 *
 * This is a cheap first pass, NOT the security boundary. It verifies the
 * cookie's signature and expiry and nothing else — it cannot see Redis, so it
 * cannot know a session was revoked. `currentSession()` in lib/prabalos/guard.ts
 * does the authoritative check, and every page and write route behind here
 * calls it.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (payload) return NextResponse.next();

  const { pathname, search } = request.nextUrl;

  // API routes get a flat 401. A redirect to an HTML login page would be a
  // confusing response to a fetch() and would leak the login URL's existence
  // into anything that follows redirects.
  if (pathname.startsWith("/api/")) {
    return new NextResponse(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  // Only relative paths are round-tripped, and the login page validates it
  // again before navigating — an open redirect here would be a phishing
  // primitive on a domain that is otherwise entirely trustworthy.
  url.search = pathname === "/os" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/os/:path*", "/os", "/api/prabalos/admin/:path*"],
};
