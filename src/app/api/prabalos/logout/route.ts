import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/prabalos/session";
import { revokeSession } from "@/lib/prabalos/store";

/**
 * Logout deletes the session id from Redis before clearing the cookie, so a
 * copy of the cookie taken beforehand is dead too. Clearing only the cookie
 * would leave a valid signed token in the wild for up to twelve hours.
 */

export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  const jar = await cookies();
  const payload = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (payload) await revokeSession(payload.jti);

  jar.delete(SESSION_COOKIE);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
