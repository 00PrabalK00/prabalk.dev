import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./session";
import { sessionValid } from "./store";

/**
 * The real authentication check, for server components and write routes.
 *
 * `proxy.ts` does a signature-and-expiry check at the edge to bounce anonymous
 * traffic cheaply, but it is not a trust boundary: proxy code is deployed to
 * the CDN, has no database access, and cannot know that a session was revoked
 * thirty seconds ago. Everything that actually reads or writes state calls
 * this, which additionally confirms the session id still exists in Redis.
 */
export async function currentSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (!payload) return null;
  if (!(await sessionValid(payload.jti))) return null;
  return payload;
}

export async function isAuthed(): Promise<boolean> {
  return (await currentSession()) !== null;
}

/** 401 with no body — the same shape the device API uses. */
export function unauthorized(): Response {
  return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
}
