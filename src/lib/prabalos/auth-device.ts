import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { claimNonce } from "./store";

/**
 * Device authentication.
 *
 * The ESP32 signs every request with HMAC-SHA256 rather than presenting a
 * bearer token, for one reason: a bearer token that leaks anywhere in the
 * chain — a proxy log, a crash dump, a mis-set header — is replayable forever.
 * A signature is scoped to one method, one path, one body, one timestamp and
 * one nonce, so a captured request is worth nothing after 120 seconds.
 *
 * Canonical string, newline-joined, in this exact order:
 *
 *   METHOD \n PATH \n device_id \n timestamp \n nonce \n sha256_hex(body)
 *
 * PATH is the pathname only — no query string, no origin. The device builds it
 * from a compile-time constant, so anything that rewrites the URL in transit
 * (a CDN adding tracking params, say) cannot break the signature.
 *
 * The body hash is included even for GETs, where it is the hash of the empty
 * string. Keeping the shape constant means the firmware has one code path.
 */

/** Requests older or newer than this are rejected outright. */
const MAX_SKEW_S = 120;

export interface DeviceAuthOk {
  ok: true;
  deviceId: string;
  body: string;
}

export interface DeviceAuthFail {
  ok: false;
  /** Logged server-side. Never returned to the caller. */
  reason: string;
  status: 401 | 429 | 503;
}

export type DeviceAuthResult = DeviceAuthOk | DeviceAuthFail;

function fail(reason: string, status: DeviceAuthFail["status"] = 401): DeviceAuthFail {
  return { ok: false, reason, status };
}

function eqConstantTime(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  // timingSafeEqual throws on a length mismatch, which would itself leak the
  // length. Compare a fixed-size digest of each instead so the comparison is
  // always over equal-length buffers.
  const da = createHash("sha256").update(ba).digest();
  const db = createHash("sha256").update(bb).digest();
  return timingSafeEqual(da, db);
}

export function canonicalString(parts: {
  method: string;
  path: string;
  deviceId: string;
  timestamp: string;
  nonce: string;
  body: string;
}): string {
  const bodyHash = createHash("sha256").update(parts.body, "utf8").digest("hex");
  return [
    parts.method.toUpperCase(),
    parts.path,
    parts.deviceId,
    parts.timestamp,
    parts.nonce,
    bodyHash,
  ].join("\n");
}

export function sign(canonical: string, keyHex: string): string {
  return createHmac("sha256", Buffer.from(keyHex, "hex")).update(canonical, "utf8").digest("hex");
}

/**
 * Verifies a device request. Reads the body, so the caller must use the
 * returned `body` string rather than reading the request again.
 *
 * Every rejection returns a flat 401 with no detail. Telling an attacker
 * whether the device id, the timestamp or the signature was wrong hands them a
 * free oracle; the reason is for the server log only.
 */
export async function verifyDeviceRequest(req: Request): Promise<DeviceAuthResult> {
  const expectedDeviceId = process.env.PRABALOS_DEVICE_ID;
  const keyHex = process.env.PRABALOS_DEVICE_KEY;
  if (!expectedDeviceId || !keyHex) {
    return fail("device credentials not configured", 503);
  }

  const deviceId = req.headers.get("x-pos-device") ?? "";
  const timestamp = req.headers.get("x-pos-timestamp") ?? "";
  const nonce = req.headers.get("x-pos-nonce") ?? "";
  const signature = req.headers.get("x-pos-signature") ?? "";

  if (!deviceId || !timestamp || !nonce || !signature) return fail("missing signing headers");
  if (nonce.length < 8 || nonce.length > 64) return fail("bad nonce shape");
  if (signature.length !== 64) return fail("bad signature shape");
  if (!eqConstantTime(deviceId, expectedDeviceId)) return fail("unknown device");

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return fail("bad timestamp");
  const skew = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (skew > MAX_SKEW_S) return fail(`clock skew ${skew}s`);

  const body = await req.text();
  const path = new URL(req.url).pathname;
  const expected = sign(
    canonicalString({ method: req.method, path, deviceId, timestamp, nonce, body }),
    keyHex,
  );

  // Compare before burning the nonce: a wrong signature should not let an
  // attacker consume nonces the real device might later choose.
  if (!eqConstantTime(signature, expected)) return fail("bad signature");

  if (!(await claimNonce(nonce))) return fail("nonce replay");

  return { ok: true, deviceId, body };
}

/** Uniform rejection. No body, no hint, no `WWW-Authenticate` challenge. */
export function deviceUnauthorized(status: 401 | 429 | 503 = 401): Response {
  return new Response(null, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
