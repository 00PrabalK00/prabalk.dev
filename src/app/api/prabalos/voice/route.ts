import { deviceUnauthorized, verifyDeviceRequest } from "@/lib/prabalos/auth-device";
import { rateLimit } from "@/lib/prabalos/store";
import { get } from "@vercel/blob";
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
  if (!note?.pathname) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  // Read through the store with its token. Private blobs have no fetchable
  // URL, which is the point: the audio cannot leave the store except through
  // this route, and this route requires a valid device signature.
  const result = await get(note.pathname, { access: "private" });
  if (!result) {
    console.error(`[prabalos] voice blob missing: ${note.pathname}`);
    return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "no-store",
      "X-POS-Voice-Id": note.id,
      // The firmware sizes its read loop from this.
      "Content-Length": String(note.bytes),
    },
  });
}
