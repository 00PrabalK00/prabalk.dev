import { deviceUnauthorized, verifyDeviceRequest } from "@/lib/prabalos/auth-device";
import { rateLimit } from "@/lib/prabalos/store";
import { get } from "@vercel/blob";
import { getFirmware } from "@/lib/prabalos/firmware";

/**
 * Streams the pending firmware image to the device.
 *
 * Proxied rather than redirecting to the blob URL, for the same reasons as
 * voice notes: the device talks to one host with one certificate, and the
 * bytes are only served to a caller that produced a valid HMAC signature.
 *
 * Content-Length is preserved where the upstream provides one — the firmware
 * writer wants to know the total up front so it can size the OTA partition
 * write and show honest progress rather than a spinner.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request): Promise<Response> {
  const auth = await verifyDeviceRequest(req);
  if (!auth.ok) {
    console.warn(`[prabalos] firmware rejected: ${auth.reason}`);
    return deviceUnauthorized(auth.status);
  }

  // Low: a device downloading its own firmware more than a few times a minute
  // is a device stuck in a reboot loop, and hammering the blob store makes
  // that worse rather than better.
  const limited = await rateLimit(`fw:${auth.deviceId}`, 4, 300);
  if (!limited.ok) return deviceUnauthorized(429);

  const release = await getFirmware();
  if (!release?.pathname) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  // Private read, same as voice notes — and more important here: a firmware
  // image reachable by URL is an executable published to the internet.
  const result = await get(release.pathname, { access: "private" });
  if (!result) {
    console.error(`[prabalos] firmware blob missing: ${release.pathname}`);
    return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store",
      "X-POS-FW-Version": release.version,
      "X-POS-FW-Sha256": release.sha256,
      // Content-Length matters: the OTA writer pre-sizes the partition write
      // and shows real progress instead of a spinner.
      "Content-Length": String(release.bytes),
    },
  });
}
