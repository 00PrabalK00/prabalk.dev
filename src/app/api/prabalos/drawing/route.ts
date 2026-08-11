import { after } from "next/server";
import { deviceUnauthorized, verifyDeviceRequest } from "@/lib/prabalos/auth-device";
import { notifyDrawing } from "@/lib/prabalos/notify";
import { rateLimit } from "@/lib/prabalos/store";
import { DRAWING_MAX_BYTES, drawingConfigured, putDrawing } from "@/lib/prabalos/drawing";

/**
 * A drawing from the device.
 *
 * Body is the stroke text the firmware emits: "x,y x,y|x,y x,y", strokes
 * separated by pipes and points by spaces. Validated rather than trusted —
 * this comes off a microcontroller and ends up rendered in a browser.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 20;

export async function POST(req: Request): Promise<Response> {
  const auth = await verifyDeviceRequest(req);
  if (!auth.ok) {
    console.warn(`[prabalos] drawing rejected: ${auth.reason}`);
    return deviceUnauthorized(auth.status);
  }

  // Someone drawing enthusiastically is still one drawing every few seconds at
  // most; anything faster is a stuck send loop.
  const limited = await rateLimit(`draw:${auth.deviceId}`, 6, 60);
  if (!limited.ok) return deviceUnauthorized(429);

  if (!drawingConfigured()) {
    return Response.json(
      { error: "Drawings need Vercel Blob." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const strokes = auth.body.trim();
  if (strokes.length < 4 || strokes.length > DRAWING_MAX_BYTES) {
    return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  // Digits, commas, spaces and pipes only. Rejecting anything else here means
  // the dashboard can parse it with a plain split and never has to treat it as
  // untrusted markup.
  if (!/^[0-9, |]+$/.test(strokes)) {
    return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const drawing = await putDrawing(strokes);

  after(() => notifyDrawing());

  return Response.json(
    { ok: true, id: drawing.id, bytes: drawing.bytes },
    { headers: { "Cache-Control": "no-store" } },
  );
}
