import { createHash } from "node:crypto";
import { del, put } from "@vercel/blob";
import { nowSec, redis } from "./store";

/**
 * Firmware updates, over the air.
 *
 * The device lives in another country. Every alternative to this is a video
 * call, a USB cable and someone else's patience, so the bar for "is OTA worth
 * the complexity" was cleared before the first line was written.
 *
 * Two things make it safe to expose:
 *
 * The upload re-verifies TOTP at the moment of the request. A valid session
 * cookie is enough to change a status message; it is not enough to replace the
 * code running on a device in someone's home. An unlocked laptop should not be
 * able to flash firmware.
 *
 * The device fetches over the same HMAC-signed, certificate-validated channel
 * as everything else, and checks the SHA-256 it was told to expect — where that
 * hash arrived in an authenticated /sync response. So the image is pinned by a
 * value the device received over a channel an attacker cannot forge, which is
 * what a separate image signature would have bought, without a second key to
 * manage.
 *
 * Recovery is the partition table's job: the bootloader keeps the previous slot
 * and falls back if the new image never marks itself valid.
 */

const KEY = "pos:fw";

/** Two OTA slots of 2,031,616 bytes; anything larger cannot be written. */
export const FIRMWARE_MAX_BYTES = 2_031_616;

export interface FirmwareRelease {
  version: string;
  sha256: string;
  bytes: number;
  url: string;
  ts: number;
  /** Version the device last reported running, so /os can show progress. */
  installed: string;
}

export function firmwareConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function putFirmware(bin: ArrayBuffer, version: string): Promise<FirmwareRelease> {
  const previous = await getFirmware();

  const sha256 = createHash("sha256").update(Buffer.from(bin)).digest("hex");
  const blob = await put(`prabalos/fw-${version}-${sha256.slice(0, 8)}.bin`, bin, {
    access: "public",
    contentType: "application/octet-stream",
    addRandomSuffix: true,
  });

  const release: FirmwareRelease = {
    version,
    sha256,
    bytes: bin.byteLength,
    url: blob.url,
    ts: nowSec(),
    installed: previous?.installed ?? "",
  };

  await redis().hset(KEY, {
    version: release.version,
    sha256: release.sha256,
    bytes: String(release.bytes),
    url: release.url,
    ts: String(release.ts),
    installed: release.installed,
  });
  await redis().incr("pos:ver");

  if (previous?.url) {
    try {
      await del(previous.url);
    } catch {
      /* an orphaned blob is untidy; a failed upload would be worse */
    }
  }

  return release;
}

export async function getFirmware(): Promise<FirmwareRelease | null> {
  const h = await redis().hgetall(KEY);
  if (!h || !h.version) return null;
  const num = (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    version: String(h.version),
    sha256: String(h.sha256 ?? ""),
    bytes: num(h.bytes),
    url: String(h.url ?? ""),
    ts: num(h.ts),
    installed: String(h.installed ?? ""),
  };
}

/**
 * Records what the device is actually running, reported on every poll.
 *
 * Does not bump the version counter: this changes on every sync, and bumping
 * would make the ETag useless and defeat the 304 path entirely.
 */
export async function noteInstalledVersion(version: string): Promise<void> {
  const current = await getFirmware();
  if (!current || current.installed === version) return;
  await redis().hset(KEY, { installed: version });
}

export async function clearFirmware(): Promise<void> {
  const current = await getFirmware();
  if (current?.url) {
    try {
      await del(current.url);
    } catch {
      /* ignore */
    }
  }
  await redis().del(KEY);
  await redis().incr("pos:ver");
}
