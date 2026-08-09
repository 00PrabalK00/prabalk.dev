#!/usr/bin/env node
/**
 * Development client for the PrabalOS device API.
 *
 * Signs a request exactly the way the ESP32 will, so the server half can be
 * finished and verified long before any firmware exists — and so that when the
 * firmware's signature does not match, you have a known-good reference to diff
 * against.
 *
 *   node scripts/pos-request.mjs GET  /api/prabalos/sync
 *   node scripts/pos-request.mjs POST /api/prabalos/event '{"type":"love","event_id":"abc12345"}'
 *
 * Reads PRABALOS_DEVICE_ID / PRABALOS_DEVICE_KEY from the environment or from
 * a local .env.local. Override the origin with POS_ORIGIN
 * (default http://localhost:3000).
 *
 * Extra flags:
 *   --etag "v12"    send If-None-Match, to exercise the 304 path
 *   --skew -300     shift the timestamp, to exercise clock-skew rejection
 *   --nonce fixed   reuse a nonce, to exercise replay rejection
 */

import { createHash, createHmac, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

function loadDotEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local is fine when the vars are already exported */
  }
}
loadDotEnv(new URL("../.env.local", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};

const etag = flag("etag", null);
const skew = Number(flag("skew", "0"));
const fixedNonce = flag("nonce", null);

const method = (argv[0] || "GET").toUpperCase();
const path = argv[1] || "/api/prabalos/sync";
const body = argv[2] ?? "";

const origin = process.env.POS_ORIGIN || "http://localhost:3000";
const deviceId = process.env.PRABALOS_DEVICE_ID;
const keyHex = process.env.PRABALOS_DEVICE_KEY;

if (!deviceId || !keyHex) {
  console.error("Set PRABALOS_DEVICE_ID and PRABALOS_DEVICE_KEY (or put them in .env.local).");
  process.exit(1);
}

const timestamp = String(Math.floor(Date.now() / 1000) + skew);
const nonce = fixedNonce || randomBytes(12).toString("hex");
const bodyHash = createHash("sha256").update(body, "utf8").digest("hex");

// Path only — no query string. Must match `canonicalString()` in
// src/lib/prabalos/auth-device.ts byte for byte.
const pathname = path.split("?")[0];
const canonical = [method, pathname, deviceId, timestamp, nonce, bodyHash].join("\n");
const signature = createHmac("sha256", Buffer.from(keyHex, "hex"))
  .update(canonical, "utf8")
  .digest("hex");

const headers = {
  "X-POS-Device": deviceId,
  "X-POS-Timestamp": timestamp,
  "X-POS-Nonce": nonce,
  "X-POS-Signature": signature,
  // Telemetry the real device sends with every poll.
  "X-POS-FW": "dev-script",
  "X-POS-RSSI": "-52",
  "X-POS-HEAP": "84000",
  "X-POS-BLOCK": "41000",
  "X-POS-QUEUE": "0",
};
if (body) headers["Content-Type"] = "application/json";
if (etag) headers["If-None-Match"] = `"${etag.replace(/^"|"$/g, "")}"`;

const res = await fetch(`${origin}${path}`, {
  method,
  headers,
  body: body || undefined,
});

console.log(`${res.status} ${res.statusText}`);
for (const [k, v] of res.headers) {
  if (/^(etag|cache-control|content-type|retry-after)$/i.test(k)) console.log(`  ${k}: ${v}`);
}
const text = await res.text();
if (text) {
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
}
