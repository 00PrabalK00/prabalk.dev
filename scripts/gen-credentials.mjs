#!/usr/bin/env node
/**
 * One-off credential generator for PrabalOS.
 *
 *   node scripts/gen-credentials.mjs 'your-password-here'
 *   node scripts/gen-credentials.mjs 'new-password' --password-only
 *
 * Prints the environment lines to paste into the Vercel project settings and
 * the `otpauth://` URI to enrol an authenticator app. It writes nothing to
 * disk on purpose — the only copies of these secrets should be in Vercel, in
 * your password manager, and in the ESP32's NVS.
 *
 * `--password-only` regenerates just the password salt and hash. Use it to fix
 * a mistyped or shell-mangled password without invalidating the authenticator
 * enrolment, every active session, and the key already flashed to the device.
 *
 * Run it locally. Never run it in CI, never paste the output into a chat, a
 * commit, or an issue.
 */

import { createHash, randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error("usage: node scripts/gen-credentials.mjs '<password>'");
  console.error("");
  console.error("Use SINGLE quotes in PowerShell. Double quotes expand $variables");
  console.error("and backticks, so the script would hash something other than what");
  console.error("you typed — and login would then fail forever with no clue why.");
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

/**
 * Fingerprint of the string the shell actually delivered.
 *
 * This exists because the failure it catches is otherwise invisible: PowerShell
 * expands `$name` and backticks inside double quotes, so `"Pa$$w0rd"` arrives as
 * `Pa`, gets hashed, and every subsequent login attempt with the real password
 * fails with a generic error that looks like a server bug. Eight hex characters
 * of a SHA-256 is enough to compare against what you meant to type and reveals
 * nothing about the password itself.
 */
const fingerprint = createHash("sha256").update(password, "utf8").digest("hex").slice(0, 8);

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

if (process.argv.includes("--recovery")) {
  // Emergency access for when the authenticator is gone: a dead phone, a
  // borrowed one. It replaces the TOTP factor only — the normal password is
  // still required — and it is capped at five uses, after which this script
  // must be run again on a trusted machine.
  //
  // Generated, never chosen. 130 bits from the system CSPRNG, printed in
  // groups so it can be copied off a screen or written on paper without
  // transcription errors. Crockford's alphabet: no I, L, O or U, so there is
  // no confusing 1/I or 0/O when reading it back at a bad moment.
  const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const raw = randomBytes(26);
  let code = "";
  for (let i = 0; i < 26; i++) code += ALPHABET[raw[i] % ALPHABET.length];
  const grouped = code.match(/.{1,5}/g).join("-");

  const rSalt = randomBytes(32);
  const rHash = scryptSync(code, rSalt, KEYLEN, { N, r, p, maxmem: 128 * 1024 * 1024 });

  console.log(`
=====================================================================
 EMERGENCY RECOVERY CODE

 Write this down and keep it somewhere that is NOT your phone —
 a wallet, a safe, a note at home. It is shown once and cannot be
 recovered from Vercel afterwards.

     ${grouped}

 Use it on /login by choosing "Use a recovery code". It replaces the
 6-digit authenticator code; your normal password is still needed.

 Good for ${5} sign-ins. After that, run this again on your PC:
     node scripts/gen-credentials.mjs '<password>' --recovery

 Generating a new code resets the count automatically, because the
 counter is keyed to the code itself.
=====================================================================
 Add these two to Vercel, then redeploy. Everything else stays.

PRABALOS_RECOVERY_SALT=${rSalt.toString("hex")}
PRABALOS_RECOVERY_HASH=${rHash.toString("hex")}
=====================================================================
`);
  process.exit(0);
}

if (process.argv.includes("--password-only")) {
  console.log(`
=====================================================================
 PASSWORD ONLY

 The shell handed this script a password of ${password.length} characters,
 fingerprint ${fingerprint}. If that length is wrong, your shell mangled
 it — use single quotes — and these values are for the wrong string.

 Replace ONLY these two in Vercel, then redeploy. Your authenticator
 enrolment, active sessions and the device key are untouched.
=====================================================================

PRABALOS_PW_SALT=${salt.toString("hex")}
PRABALOS_PW_HASH=${hash.toString("hex")}

=====================================================================
`);
  process.exit(0);
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
 CHECK THIS FIRST

 The shell handed this script a password of ${password.length} characters,
 fingerprint ${fingerprint}.

 If that length is not what you typed, your shell mangled it — use
 single quotes — and the hash below is for the wrong string. Nothing
 will ever log in. Re-run before pasting anything into Vercel.
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
