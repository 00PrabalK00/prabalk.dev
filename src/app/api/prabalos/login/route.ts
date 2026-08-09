import { cookies } from "next/headers";
import { authConfigured, verifyPassword, verifyTotp } from "@/lib/prabalos/auth-user";
import { cookieOptions, issueSession, SESSION_COOKIE, SESSION_TTL_S } from "@/lib/prabalos/session";
import {
  clearLoginFailures,
  createSession,
  logAuth,
  diagnoseStorage,
  loginFailures,
  noteLoginFailure,
  storageConfigured,
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
  // Anything that escapes here used to become a bare 500 with an empty body,
  // which the login form then rendered as "Incorrect credentials." — a server
  // outage disguised as a typo, and the single worst way to spend an evening.
  // Storage problems are now reported as storage problems.
  try {
    return await handleLogin(req);
  } catch (err) {
    console.error("[prabalos] login failed with an unhandled error:", err);
    // Name the failure. `diagnoseStorage` reports the shape of the config and
    // the result of one probe — never a value — so the fix is obvious from the
    // login screen instead of requiring a trip through the deployment logs.
    const reason = await diagnoseStorage().catch(() => "unknown");
    return json({ error: storageHint(reason), reason }, 503);
  }
}

async function handleLogin(req: Request): Promise<Response> {
  if (!authConfigured()) {
    console.error("[prabalos] login attempted but auth env vars are not configured");
    return json({ error: "Sign-in is not configured.", reason: "config" }, 503);
  }
  if (!storageConfigured()) {
    console.error("[prabalos] login attempted but Upstash env vars are not configured");
    return json({ error: "Sign-in is not configured.", reason: "storage" }, 503);
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

/** Turns a diagnosis code into the actual next action. */
function storageHint(reason: string): string {
  switch (reason) {
    case "env-missing":
      return "Storage is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, then redeploy.";
    case "url-is-tcp-not-rest":
      return "UPSTASH_REDIS_REST_URL is the redis:// connection string. Use the https:// REST URL from the Upstash REST API tab.";
    case "url-not-https":
      return "UPSTASH_REDIS_REST_URL must start with https://.";
    case "token-rejected":
      return "Upstash rejected the token. Copy UPSTASH_REDIS_REST_TOKEN again without the surrounding quotes, then redeploy.";
    case "unreachable":
      return "Cannot reach Upstash. Check the database still exists and has not been paused.";
    default:
      return "Sign-in is temporarily unavailable.";
  }
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
