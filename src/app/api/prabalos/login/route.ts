import { cookies } from "next/headers";
import { authConfigured, verifyPassword, verifyTotp } from "@/lib/prabalos/auth-user";
import { cookieOptions, issueSession, SESSION_COOKIE, SESSION_TTL_S } from "@/lib/prabalos/session";
import {
  clearLoginFailures,
  createSession,
  logAuth,
  loginFailures,
  noteLoginFailure,
} from "@/lib/prabalos/store";

/**
 * The only way into /os.
 *
 * Password and TOTP are both required and both checked on every attempt, even
 * when the password is already wrong. Short-circuiting would turn the response
 * time into an oracle telling an attacker which half they got right, which is
 * exactly the information that makes a two-factor scheme worth attacking.
 *
 * Every rejection returns the same message. There is one account; there is
 * nothing to enumerate, and nothing useful to say.
 */

export const dynamic = "force-dynamic";

const MAX_FAILURES = 5;
const LOCKOUT_WINDOW_S = 15 * 60;
const GENERIC_ERROR = "Incorrect credentials.";

export async function POST(req: Request): Promise<Response> {
  if (!authConfigured()) {
    console.error("[prabalos] login attempted but auth env vars are not configured");
    return json({ error: "Not configured." }, 503);
  }

  const ip = clientIp(req);
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 120);

  const failures = await loginFailures(ip);
  if (failures >= MAX_FAILURES) {
    await logAuth({ ok: false, ip, ua, reason: "locked out" });
    // 429, not 401: the caller should know to stop rather than keep hammering.
    return json({ error: "Too many attempts. Try again later." }, 429);
  }

  let body: { password?: unknown; code?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: GENERIC_ERROR }, 400);
  }

  const password = typeof body.password === "string" ? body.password : "";
  const code = typeof body.code === "string" ? body.code : "";

  // Both checks always run. `verifyPassword` is the slow one (scrypt), and
  // running it unconditionally is what keeps the timing flat.
  const passwordOk = await verifyPassword(password);
  const totpOk = verifyTotp(code);

  if (!passwordOk || !totpOk) {
    const count = await noteLoginFailure(ip, LOCKOUT_WINDOW_S);
    await logAuth({
      ok: false,
      ip,
      ua,
      reason: !passwordOk && !totpOk ? "password+totp" : !passwordOk ? "password" : "totp",
    });
    const remaining = Math.max(0, MAX_FAILURES - count);
    return json({ error: GENERIC_ERROR, remaining }, 401);
  }

  const { token, payload } = await issueSession();
  await createSession(payload.jti, SESSION_TTL_S);
  await clearLoginFailures(ip);
  await logAuth({ ok: true, ip, ua, reason: "login" });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(isHttps(req), SESSION_TTL_S));

  return json({ ok: true }, 200);
}

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * A `Secure` cookie is silently dropped on plain-HTTP localhost, which would
 * make local development impossible. In production Vercel always terminates
 * TLS and sets x-forwarded-proto, so this resolves to true.
 */
function isHttps(req: Request): boolean {
  const proto = req.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  return new URL(req.url).protocol === "https:";
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}
