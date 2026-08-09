import { deviceUnauthorized, verifyDeviceRequest } from "@/lib/prabalos/auth-device";
import { rateLimit } from "@/lib/prabalos/store";
import { getVoiceNote } from "@/lib/prabalos/voice";

/**
 * Streams the current voice note to the device.
 *
 * Proxied rather than handing the device the blob URL directly, for two
 * reasons. The blob URL is public — unguessable, but public — and a voice note
 * to someone's parents deserves the same signed-request treatment as
 * everything else here. And it keeps the device talking to exactly one host
 * with one certificate, which matters on a chip where each additional TLS
 * peer is real memory.
 *
 * The response passes straight through, so this function never holds the
 * ~640 KB in memory, and Content-Length is preserved when the upstream gives
 * one — which lets the firmware size its reads instead of guessing.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request): Promise<Response> {
  const auth = await verifyDeviceRequest(req);
  if (!auth.ok) {
    console.warn(`[prabalos] voice rejected: ${auth.reason}`);
    return deviceUnauthorized(auth.status);
  }

  const limited = await rateLimit(`voice:${auth.deviceId}`, 10, 60);
  if (!limited.ok) return deviceUnauthorized(429);

  const note = await getVoiceNote();
  if (!note?.url) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const upstream = await fetch(note.url, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    console.error(`[prabalos] blob fetch failed: ${upstream.status}`);
    return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }

  const headers: Record<string, string> = {
    "Content-Type": "audio/wav",
    "Cache-Control": "no-store",
    "X-POS-Voice-Id": note.id,
  };
  const len = upstream.headers.get("content-length");
  if (len) headers["Content-Length"] = len;

  return new Response(upstream.body, { headers });
}
