#!/usr/bin/env node
/**
 * One-off credential generator for PrabalOS.
 *
 *   node scripts/gen-credentials.mjs "your-password-here"
 *
 * Prints the environment lines to paste into the Vercel project settings and
 * the `otpauth://` URI to enrol an authenticator app. It writes nothing to
 * disk on purpose — the only copies of these secrets should be in Vercel, in
 * your password manager, and in the ESP32's NVS.
 *
 * Run it locally. Never run it in CI, never paste the output into a chat, a
 * commit, or an issue.
 */

import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error("usage: node scripts/gen-credentials.mjs \"<password>\"");
  process.exit(1);
}
if (password.length < 12) {
  console.error("Refusing: use at least 12 characters. This is the only password on the box.");
  process.exit(1);
}

/* scrypt parameters. N=2^15 costs ~100 ms per verification on Vercel's
 * runtime, which is a rounding error for a login that happens a few times a
 * day and a real wall for anyone brute-forcing a leaked hash. */
const N = 32768;
const r = 8;
const p = 1;
const KEYLEN = 64;

const salt = randomBytes(32);
const hash = scryptSync(password, salt, KEYLEN, { N, r, p, maxmem: 128 * 1024 * 1024 });

/* RFC 4648 base32, no padding — what authenticator apps expect. */
function base32(buf) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += A[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += A[(value << (5 - bits)) & 31];
  return out;
}

const totpSecret = base32(randomBytes(20)); // 160-bit, the RFC 4226 recommendation
const sessionKey = randomBytes(32).toString("hex");
const deviceKey = randomBytes(32).toString("hex");

const issuer = "PrabalOS";
const account = "prabal";
const uri =
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}` +
  `?secret=${totpSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

console.log(`
=====================================================================
 Vercel -> Project -> Settings -> Environment Variables (Production)
 Do NOT prefix any of these with NEXT_PUBLIC_.
=====================================================================

PRABALOS_PW_SALT=${salt.toString("hex")}
PRABALOS_PW_HASH=${hash.toString("hex")}
PRABALOS_TOTP_SECRET=${totpSecret}
PRABALOS_SESSION_KEY=${sessionKey}
PRABALOS_DEVICE_ID=PRABALOS_HOME_01
PRABALOS_DEVICE_KEY=${deviceKey}

---------------------------------------------------------------------
 Authenticator enrolment (scan or paste into Google Authenticator,
 1Password, Aegis, Ente Auth...):

${uri}

 Manual entry: secret ${totpSecret}, time-based, 6 digits, 30 seconds.
---------------------------------------------------------------------
 ESP32: flash PRABALOS_DEVICE_KEY into NVS, not into the sketch.
 Anyone holding the device can read it back out of flash — that is
 accepted, because the key grants nothing beyond the five PrabalOS
 endpoints and those are rate limited per device.
---------------------------------------------------------------------
 Also required (from the Upstash console):

UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
=====================================================================
`);
