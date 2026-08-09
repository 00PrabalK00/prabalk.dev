/**
 * Session tokens, written against Web Crypto only.
 *
 * The runtime constraint drives the whole design: `proxy.ts` runs on the Edge
 * runtime, where `node:crypto` does not exist, but the login route and the /os
 * page run on Node. Using `crypto.subtle` throughout means one implementation
 * verifies the cookie in both places instead of two that can drift apart.
 *
 * Format is a compact HMAC-SHA256 token, deliberately not a JWT: there is no
 * algorithm field to confuse, no `alg: none`, no library, and one hard-coded
 * verification path.
 *
 *   base64url(JSON payload) "." base64url(HMAC-SHA256 of that first segment)
 *
 * The payload carries a `jti` that is also written to Redis, so logout and
 * "revoke everything" actually invalidate a cookie rather than politely asking
 * the browser to forget it.
 */

export const SESSION_COOKIE = "pos_session";
/** Twelve hours. Long enough to not be annoying, short enough that a stolen
 *  laptop is not a standing invitation. */
export const SESSION_TTL_S = 12 * 60 * 60;

export interface SessionPayload {
  /** Session id, also a Redis key. */
  jti: string;
  /** Issued at, epoch seconds. */
  iat: number;
  /** Expiry, epoch seconds. */
  exp: number;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Returns a view over a plain ArrayBuffer — `crypto.subtle` will not accept a
 *  Uint8Array whose backing buffer might be a SharedArrayBuffer. */
function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function sessionSecret(): string {
  const key = process.env.PRABALOS_SESSION_KEY;
  if (!key || key.length < 32) {
    throw new Error("PRABALOS_SESSION_KEY is missing or too short (need >= 32 chars).");
  }
  return key;
}

export async function issueSession(ttlSec = SESSION_TTL_S): Promise<{
  token: string;
  payload: SessionPayload;
}> {
  const iat = Math.floor(Date.now() / 1000);
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const payload: SessionPayload = { jti: b64urlEncode(bytes), iat, exp: iat + ttlSec };

  const head = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(sessionSecret()),
    new TextEncoder().encode(head),
  );
  return { token: `${head}.${b64urlEncode(new Uint8Array(sig))}`, payload };
}

/**
 * Verifies signature and expiry. Does NOT check whether the session still
 * exists in Redis — that is the caller's job, because `proxy.ts` deliberately
 * avoids network I/O and everything behind it re-checks anyway.
 */
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;

  const head = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^[A-Za-z0-9_-]+$/.test(head) || !/^[A-Za-z0-9_-]+$/.test(sig)) return null;

  let ok: boolean;
  try {
    ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(sessionSecret()),
      b64urlDecode(sig),
      new TextEncoder().encode(head),
    );
  } catch {
    return null;
  }
  if (!ok) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(head))) as SessionPayload;
    if (typeof payload.jti !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Cookie attributes, in one place so they cannot drift between the set and the
 * clear. `SameSite=Strict` is safe here because /os is never linked from
 * anywhere — there is no cross-site navigation into it to break.
 *
 * `Secure` is dropped only on plain-HTTP localhost, since a Secure cookie is
 * silently discarded there and local development would be impossible.
 */
export function cookieOptions(secure: boolean, maxAge: number) {
  return {
    httpOnly: true,
    secure,
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}
