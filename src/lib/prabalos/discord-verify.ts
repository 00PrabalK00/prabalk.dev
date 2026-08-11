import crypto from "node:crypto";

/**
 * Ed25519 verification for Discord interaction requests.
 *
 * This is the only thing standing between the open internet and the device in
 * Bangkok. The interactions endpoint is necessarily public — Discord has to be
 * able to reach it — so without this check anyone who found the URL could set
 * a status or push a message onto the parents' screen with a plain curl.
 *
 * Discord actively probes this. When the endpoint URL is saved, and
 * periodically afterwards, they send deliberately-invalid signatures and expect
 * a 401. An endpoint that answers 200 to a bad signature gets removed.
 */

/**
 * ASN.1 SPKI header for an Ed25519 public key.
 *
 * The portal hands out a bare 32-byte key, while `createPublicKey` wants
 * structured DER. The prefix is fixed for Ed25519 — algorithm OID 1.3.101.112
 * followed by a 33-byte bit string — so prepending it is the whole conversion.
 */
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/**
 * Rejects signatures older than this.
 *
 * Discord does not require it, but the signature covers the timestamp, so a
 * captured request stays valid forever without it. Five minutes is generous
 * enough to survive clock drift and a slow cold start.
 */
const MAX_SKEW_S = 300;

let cachedKey: crypto.KeyObject | null = null;

function publicKey(): crypto.KeyObject | null {
  if (cachedKey) return cachedKey;

  const hex = process.env.PRABALOS_DISCORD_PUBLIC_KEY?.trim().replace(/^['"]|['"]$/g, "");
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) return null;

  try {
    cachedKey = crypto.createPublicKey({
      key: Buffer.concat([SPKI_PREFIX, Buffer.from(hex, "hex")]),
      format: "der",
      type: "spki",
    });
    return cachedKey;
  } catch {
    return null;
  }
}

export function discordConfigured(): boolean {
  return publicKey() !== null;
}

/**
 * Verifies the signature over `timestamp + rawBody`.
 *
 * `rawBody` must be the exact bytes received. Parsing and re-serialising the
 * JSON changes key order and whitespace, and the signature then fails for
 * reasons that look like a key problem and are not.
 */
export function verifyDiscordRequest(
  rawBody: string,
  signatureHex: string | null,
  timestamp: string | null,
): boolean {
  const key = publicKey();
  if (!key || !signatureHex || !timestamp) return false;

  if (!/^[0-9a-fA-F]{128}$/.test(signatureHex)) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > MAX_SKEW_S) return false;

  try {
    // `null` algorithm: Ed25519 signs the message directly rather than a
    // pre-computed digest.
    return crypto.verify(
      null,
      Buffer.from(timestamp + rawBody, "utf8"),
      key,
      Buffer.from(signatureHex, "hex"),
    );
  } catch {
    return false;
  }
}

/**
 * The Discord account allowed to issue commands.
 *
 * A valid signature only proves the request came from Discord — it says nothing
 * about who typed the command. Anyone who could invoke the app's commands would
 * otherwise be able to drive the device, so the invoking user is checked too.
 * Unset means nobody is allowed, which fails closed.
 */
export function isAllowedUser(userId: string | undefined): boolean {
  const allowed = process.env.PRABALOS_DISCORD_USER_ID?.trim().replace(/^['"]|['"]$/g, "");
  if (!allowed || !userId) return false;

  const a = Buffer.from(allowed, "utf8");
  const b = Buffer.from(userId, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
