import { currentSession } from "./guard";
import { CSRF_HEADER } from "./constants";

/**
 * Shared entry check for every dashboard write.
 *
 * Two things happen here, and both matter:
 *
 * 1. The session is re-verified against Redis. `proxy.ts` already bounced
 *    anonymous traffic, but it runs at the edge with no database, so it cannot
 *    know about a revoked session. This is the authoritative check.
 *
 * 2. A custom header is required. The session cookie is SameSite=Strict, which
 *    already blocks cross-site form posts, but a custom header cannot be set by
 *    a cross-origin request without triggering a CORS preflight that this
 *    server never answers. Two independent mechanisms, because CSRF on an
 *    endpoint that publishes your location to a device in your parents' house
 *    is not a bug worth having once.
 */

export { CSRF_HEADER };

export type AdminGate = { ok: true } | { ok: false; response: Response };

export async function requireAdmin(req: Request): Promise<AdminGate> {
  if (req.headers.get(CSRF_HEADER) !== "1") {
    return {
      ok: false,
      response: new Response(null, { status: 403, headers: { "Cache-Control": "no-store" } }),
    };
  }
  if (!(await currentSession())) {
    return {
      ok: false,
      response: new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } }),
    };
  }
  return { ok: true };
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function ok(body: unknown = { ok: true }): Response {
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

export function badRequest(): Response {
  return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
}

/** Clamps free text before it reaches Redis. The device truncates for display,
 *  but the store should never hold an unbounded string either. */
export function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > max ? t.slice(0, max) : t;
}
