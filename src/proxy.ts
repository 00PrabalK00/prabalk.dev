import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/prabalos/session";
import { SUBDOMAIN_TO_SLUG } from "@/projects";

/**
 * Edge entry point. Two unrelated jobs, in a deliberate order.
 *
 * Next 16 renamed the `middleware` convention to `proxy`; the behaviour is
 * unchanged.
 *
 * 1. Project subdomains. `ripple.prabalkhare.com` is rewritten to `/p/ripple`
 *    — a rewrite, not a redirect, so the subdomain stays in the address bar
 *    and the case study is served from the URL people actually share.
 *
 * 2. The private half. Anonymous traffic to /os never reaches a server
 *    component that would otherwise open a Redis connection just to discover
 *    it should have been a redirect.
 *
 * The auth check is scoped by path rather than by the matcher, because the
 * matcher now has to be broad enough to see every request's Host header. A
 * broad matcher with an unscoped auth check would put the whole public site
 * behind a login.
 */

/** Hosts that are the site itself rather than a project. */
const RESERVED = new Set(["www", "prabalkhare", "localhost", "api"]);

const PROTECTED = [/^\/os(\/|$)/, /^\/api\/prabalos\/admin(\/|$)/];

/**
 * The project slug this request's Host maps to, if any.
 *
 * Handles `ripple.prabalkhare.com` in production and `ripple.localhost:3000`
 * in development, so subdomain routing is testable without touching DNS.
 */
function slugFromHost(host: string | null): string | undefined {
  if (!host) return undefined;

  const hostname = host.split(":")[0].toLowerCase();
  const labels = hostname.split(".");
  if (labels.length < 2) return undefined;

  const first = labels[0];
  if (RESERVED.has(first)) return undefined;

  return SUBDOMAIN_TO_SLUG.get(first);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  /* ---- 1. project subdomains ---- */

  const slug = slugFromHost(request.headers.get("host"));
  if (slug && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/p/${slug}`;
    return NextResponse.rewrite(url);
  }

  /* ---- 2. the private half ---- */

  if (!PROTECTED.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (payload) return NextResponse.next();

  // API routes get a flat 401. A redirect to an HTML login page would be a
  // confusing response to a fetch() and would leak the login URL's existence
  // into anything that follows redirects.
  if (pathname.startsWith("/api/")) {
    return new NextResponse(null, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
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
  /*
   * Broad, because job 1 needs the Host header on ordinary page requests. Next's
   * own assets and anything with a file extension are excluded so static media
   * does not pay for an edge invocation.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
