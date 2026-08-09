import { deviceUnauthorized, verifyDeviceRequest } from "@/lib/prabalos/auth-device";
import { rateLimit } from "@/lib/prabalos/store";
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
  if (!release?.url) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const upstream = await fetch(release.url, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    console.error(`[prabalos] firmware blob fetch failed: ${upstream.status}`);
    return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/octet-stream",
    "Cache-Control": "no-store",
    "X-POS-FW-Version": release.version,
    "X-POS-FW-Sha256": release.sha256,
  };
  const len = upstream.headers.get("content-length") ?? String(release.bytes);
  if (len) headers["Content-Length"] = len;

  return new Response(upstream.body, { headers });
}
